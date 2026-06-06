package org.lite.komunas.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lite.komunas.entity.SavedSearch;
import org.lite.komunas.repository.SavedSearchRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/saved-searches")
@RequiredArgsConstructor
public class SavedSearchController {

    private final SavedSearchRepository savedSearchRepository;

    public record SaveSearchRequest(String query) {}

    @GetMapping
    public ResponseEntity<List<SavedSearch>> getSavedSearches(@RequestParam String userId) {
        log.info("Fetching saved searches for user: {}", userId);
        return ResponseEntity.ok(savedSearchRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<SavedSearch> saveSearch(@RequestParam String userId, @RequestBody SaveSearchRequest request) {
        log.info("Saving search query: '{}' for user: {}", request.query(), userId);
        SavedSearch search = SavedSearch.builder()
                .userId(userId)
                .query(request.query())
                .createdAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(savedSearchRepository.save(search));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavedSearch(@PathVariable String id, @RequestParam String userId) {
        log.info("Deleting saved search ID: {} for user: {}", id, userId);
        savedSearchRepository.deleteByIdAndUserId(id, userId);
        return ResponseEntity.ok().build();
    }
}
