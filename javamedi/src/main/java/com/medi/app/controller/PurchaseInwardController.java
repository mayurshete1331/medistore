package com.medi.app.controller;

import com.medi.app.dto.PurchaseInwardDtos;
import com.medi.app.service.PurchaseInwardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/purchase-inward")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Purchase Inward", description = "Stock ingestion from distributor purchase bills (PDF or Image)")
public class PurchaseInwardController {

    private final PurchaseInwardService purchaseInwardService;

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Parse purchase bill file (PDF or Image) into structured medicine rows")
    public ResponseEntity<PurchaseInwardDtos.ParsedBillResponse> parseBill(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("Received purchase bill file for parsing: name={}, size={}, type={}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());
        try {
            PurchaseInwardDtos.ParsedBillResponse response = purchaseInwardService.parseBill(file);
            return ResponseEntity.ok(response);
        } catch (Throwable t) {
            log.error("Failed to parse bill file: {}", t.getMessage(), t);
            return ResponseEntity.badRequest().body(
                    PurchaseInwardDtos.ParsedBillResponse.builder()
                            .distributorName("Parsing Error")
                            .invoiceNumber("ERR")
                            .message("Failed to parse bill: " + t.getMessage())
                            .build()
            );
        }
    }

    @PostMapping("/parse-text")
    @Operation(summary = "Parse raw invoice text into structured medicine rows")
    public ResponseEntity<PurchaseInwardDtos.ParsedBillResponse> parseRawText(
            @RequestBody PurchaseInwardDtos.RawTextParseRequest request
    ) {
        log.info("Received raw invoice text for parsing: length={}",
                request.getRawText() != null ? request.getRawText().length() : 0);
        PurchaseInwardDtos.ParsedBillResponse response = purchaseInwardService.parseRawText(
                request.getRawText(), request.getDistributorName()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/commit")
    @Operation(summary = "Commit verified purchase items into live inventory and create batches")
    public ResponseEntity<PurchaseInwardDtos.CommitInwardResponse> commitInward(
            @RequestBody PurchaseInwardDtos.CommitInwardRequest request,
            @RequestParam(value = "storeId", required = false, defaultValue = "1") Long storeId
    ) {
        log.info("Committing purchase inward: distributor={}, invoice={}, itemsCount={}",
                request.getDistributorName(), request.getInvoiceNumber(),
                request.getItems() != null ? request.getItems().size() : 0);

        PurchaseInwardDtos.CommitInwardResponse response = purchaseInwardService.commitInward(request, storeId);
        return ResponseEntity.ok(response);
    }
}
