package com.rentspace;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
// Bật serialization PageImpl ổn định dưới dạng DTO thay vì raw PageImpl
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class RentSpaceApplication {

    public static void main(String[] args) {
        // Load .env from root directory
        Dotenv dotenv = Dotenv.configure()
                .directory("..") // Vì file .env nằm ở gốc dự án, Backend nằm trong folder con
                .ignoreIfMissing()
                .load();

        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(RentSpaceApplication.class, args);
    }
}
