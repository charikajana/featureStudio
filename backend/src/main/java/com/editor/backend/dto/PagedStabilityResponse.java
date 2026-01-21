package com.editor.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PagedStabilityResponse {
    private List<StabilityStats.ScenarioStability> scenarios;
    private int totalCount;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
