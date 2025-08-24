package org.lite.komunas.repository;

import org.lite.komunas.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Find user by username (for Spring Security)
     */
    Optional<UserDetails> findByUsername(String username);

    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);

    /**
     * Find all active users
     */
    List<User> findByIsActiveTrue();

    /**
     * Find users by full name (case-insensitive)
     */
    @Query("{'fullName': {$regex: ?0, $options: 'i'}}")
    List<User> findByFullNameContainingIgnoreCase(String fullName);

    /**
     * Check if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Find users by role
     */
    List<User> findByRolesContaining(String role);
} 