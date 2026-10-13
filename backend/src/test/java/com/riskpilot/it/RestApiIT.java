package com.riskpilot.it;

import com.riskpilot.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class RestApiIT {

    @Autowired
    MockMvc mvc;

    @Test
    void health() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.database", is("UP")))
                .andExpect(jsonPath("$.assessmentProvider", is("mock-rules-v1")));
    }

    @Test
    void appetiteRuleCrud() throws Exception {
        mvc.perform(get("/api/appetite-rules")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(6)));

        String body = """
                {"name":"Test rule","lineOfBusiness":"UMBRELLA","state":"TX","constructionClass":null,
                 "maxTiv":1000000,"active":true,"notes":"it"}""";
        String location = mvc.perform(post("/api/appetite-rules").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test rule")))
                .andReturn().getResponse().getContentAsString();
        long id = Long.parseLong(location.replaceAll(".*\"id\":(\\d+).*", "$1"));

        mvc.perform(put("/api/appetite-rules/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("1000000", "2000000")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.maxTiv", is(2000000)));

        mvc.perform(delete("/api/appetite-rules/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/appetite-rules/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void appetiteRuleValidation() throws Exception {
        mvc.perform(post("/api/appetite-rules").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"lineOfBusiness\":\"PROPERTY\",\"state\":\"Texas\",\"maxTiv\":-1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void documentsListAndUpload() throws Exception {
        mvc.perform(get("/api/submissions/SUB-1001/documents")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("ACORD_125")));
        mvc.perform(multipart("/api/submissions/SUB-1001/documents")
                        .file(new MockMultipartFile("file", "loss_runs.pdf", "application/pdf", new byte[]{1, 2, 3}))
                        .param("type", "LOSS_RUNS"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName", is("loss_runs.pdf")))
                .andExpect(jsonPath("$.sizeBytes", is(3)));
        mvc.perform(get("/api/submissions/NOPE/documents")).andExpect(status().isNotFound());
    }

    @Test
    void openApiIsExposed() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/appetite-rules']").exists());
    }
}
