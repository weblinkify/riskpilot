package com.riskpilot;

import com.riskpilot.domain.AppetiteRule;
import com.riskpilot.domain.Applicant;
import com.riskpilot.domain.ConstructionClass;
import com.riskpilot.domain.LineOfBusiness;
import com.riskpilot.domain.PropertyDetails;
import com.riskpilot.domain.Submission;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

/** Builders for unit tests (entities intentionally have no public setters for immutable fields). */
public final class TestData {
    private TestData() {
    }

    public static Submission submission(LineOfBusiness line, String state, ConstructionClass construction, long tiv) {
        var applicant = new Applicant();
        ReflectionTestUtils.setField(applicant, "name", "Test Co");
        ReflectionTestUtils.setField(applicant, "city", "Austin");
        ReflectionTestUtils.setField(applicant, "state", state);
        ReflectionTestUtils.setField(applicant, "yearsInBusiness", 10);
        var property = new PropertyDetails();
        ReflectionTestUtils.setField(property, "constructionClass", construction);
        ReflectionTestUtils.setField(property, "tiv", BigDecimal.valueOf(tiv));
        ReflectionTestUtils.setField(property, "occupancy", "Office");
        ReflectionTestUtils.setField(property, "yearBuilt", 2000);
        ReflectionTestUtils.setField(property, "protectionClass", 4);
        ReflectionTestUtils.setField(property, "floodZone", "X");
        ReflectionTestUtils.setField(property, "distanceToCoastMiles", BigDecimal.valueOf(100));
        var s = new Submission();
        ReflectionTestUtils.setField(s, "id", "SUB-T");
        ReflectionTestUtils.setField(s, "lineOfBusiness", line);
        ReflectionTestUtils.setField(s, "applicant", applicant);
        ReflectionTestUtils.setField(s, "property", property);
        return s;
    }

    public static AppetiteRule rule(long id, String name, LineOfBusiness line, String state, ConstructionClass min,
                                    long maxTiv, boolean active) {
        var r = new AppetiteRule();
        r.setId(id);
        r.setName(name);
        r.setLineOfBusiness(line);
        r.setState(state);
        r.setConstructionClass(min);
        r.setMaxTiv(BigDecimal.valueOf(maxTiv));
        r.setActive(active);
        return r;
    }
}
