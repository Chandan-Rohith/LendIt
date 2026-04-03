"""
Flask API wrapper for LendIt ML inference service.
Exposes risk scoring as HTTP endpoint for deployment on Render.
"""

import json
import sys
import os
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Try to import infer, but handle gracefully if it fails (model might not be trained yet)
try:
    import infer
    ML_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Warning: ML module not available - {str(e)}")
    ML_AVAILABLE = False

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for Render."""
    return jsonify({
        'status': 'ok',
        'service': 'lendit-ml',
        'ml_available': ML_AVAILABLE
    }), 200

def fallback_risk_score(avg_rating, review_count, avg_damage, avg_experience):
    """
    Fallback rule-based scoring when ML model is unavailable.
    Returns risk score (0-100) and classification.
    """
    # Simple rule-based scoring
    rating_score = (5.0 - avg_rating) * 20 if avg_rating else 0  # 0-100
    damage_score = min(avg_damage * 30, 50) if avg_damage else 0  # 0-50
    experience_score = min(avg_experience * 10, 30) if avg_experience else 0  # 0-30
    
    risk_score = (rating_score * 0.5) + (damage_score * 0.3) + (experience_score * 0.2)
    risk_score = max(0, min(100, risk_score))  # Clamp 0-100
    
    # Classification
    if risk_score <= 33:
        classification = "LOW"
    elif risk_score <= 66:
        classification = "MEDIUM"
    else:
        classification = "HIGH"
    
    return {
        "risk_score": float(risk_score),  # Ensure it's float, not int
        "risk_classification": classification,
        "source": "fallback"
    }

@app.route('/api/ml/risk-score', methods=['POST'])
def compute_risk_score():
    """
    Compute risk score for user features.
    
    Expected JSON payload:
    {
        "avg_rating": 4.5,
        "review_count": 10,
        "avg_damage": 0.3,
        "avg_experience": 2.1
    }
    
    Response:
    {
        "output": {
            "risk_score": 35.42,
            "risk_classification": "LOW"
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        # Extract features with defaults
        avg_rating = data.get('avg_rating', 5.0)
        review_count = data.get('review_count', 0)
        avg_damage = data.get('avg_damage', 0.0)
        avg_experience = data.get('avg_experience', 1.0)

        # Validate input types
        try:
            avg_rating = float(avg_rating)
            review_count = float(review_count)
            avg_damage = float(avg_damage)
            avg_experience = float(avg_experience)
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid feature types - must be numeric'}), 400

        # Try ML inference first
        result = None
        if ML_AVAILABLE:
            try:
                features_input = {
                    'avg_rating': avg_rating,
                    'review_count': review_count,
                    'avg_damage': avg_damage,
                    'avg_experience': avg_experience,
                }
                ml_result = infer.predict(features_input)
                
                # Ensure risk_score is float (infer.py returns int)
                result = {
                    "risk_score": float(ml_result['risk_score']),
                    "risk_classification": ml_result['risk_classification']
                }
            except Exception as ml_error:
                print(f"⚠️ ML inference failed: {str(ml_error)}")
                result = None
        
        # Fall back to rule-based if ML fails
        if result is None:
            result = fallback_risk_score(avg_rating, review_count, avg_damage, avg_experience)

        return jsonify({'output': result}), 200

    except Exception as e:
        print(f"❌ Error in compute_risk_score: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting LendIt ML service on port {PORT}")
    print(f"   ML Available: {ML_AVAILABLE}")
    app.run(host='0.0.0.0', port=PORT, debug=False)

