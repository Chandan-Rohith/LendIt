package com.lendit.lendit_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lendit.lendit_backend.entity.Tool;

public interface ToolRepository extends JpaRepository<Tool, Long> 
{

    List<Tool> findByOwnerId(Long ownerId);

        List<Tool> findByOwnerIdOrderByCreatedAtDescIdDesc(Long ownerId);

    List<Tool> findByCategoryId(Long categoryId);

    @Query("SELECT t FROM Tool t WHERE t.category.id = :categoryId AND t.owner.id != :userId")
    List<Tool> findByCategoryIdExcludingOwner(@Param("categoryId") Long categoryId, @Param("userId") Long userId);

    @Query(value = "SELECT t.*, " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(u.latitude)) * " +
            "cos(radians(u.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(u.latitude)))) AS distance " +
            "FROM tools t JOIN users u ON t.owner_id = u.id " +
            "WHERE t.owner_id != :userId " +
            "HAVING distance <= 10 " +
            "ORDER BY distance ASC", nativeQuery = true)
    List<Tool> findToolsWithinRadius(@Param("lat") Double latitude,
                                      @Param("lng") Double longitude,
                                      @Param("userId") Long userId);

    @Query("SELECT t FROM Tool t WHERE t.owner.id != :userId AND " +
            "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Tool> searchByKeyword(@Param("keyword") String keyword, @Param("userId") Long userId);
}
