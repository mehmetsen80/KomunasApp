package org.lite.komunas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "demo_requests")
public class DemoRequest {

    @Id
    private String id;

    private String name;
    private String email;
    private String company;
    private String notes;
    private boolean emailSent;

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;
}
