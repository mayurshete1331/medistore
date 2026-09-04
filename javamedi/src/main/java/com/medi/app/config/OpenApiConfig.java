package com.medi.app.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mediOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Medi — Medical Store ERP & Multi-Role API")
                        .description("REST API backend for Pharmacy Counter POS, Drug Master Inventory, Doctor e-Prescriptions, Customer COD Orders, and Dispensing Audit Trails.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Medi Healthcare Solutions")
                                .email("support@medicare.com"))
                        .license(new License().name("Apache 2.0")));
    }
}
