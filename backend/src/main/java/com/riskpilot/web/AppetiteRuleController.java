package com.riskpilot.web;

import com.riskpilot.domain.AppetiteRule;
import com.riskpilot.domain.ConstructionClass;
import com.riskpilot.domain.LineOfBusiness;
import com.riskpilot.repository.AppetiteRuleRepository;
import com.riskpilot.service.AuditService;
import com.riskpilot.service.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/appetite-rules")
@Tag(name = "Appetite rules", description = "Carrier appetite used by every assessment")
public class AppetiteRuleController {

    public record AppetiteRuleRequest(
            @NotBlank @Size(max = 120) String name,
            @NotNull LineOfBusiness lineOfBusiness,
            @Pattern(regexp = "^[A-Z]{2}$", message = "must be a two-letter state code") String state,
            ConstructionClass constructionClass,
            @NotNull @Positive BigDecimal maxTiv,
            boolean active,
            @Size(max = 500) String notes) {
    }

    private final AppetiteRuleRepository repository;
    private final AuditService audit;

    public AppetiteRuleController(AppetiteRuleRepository repository, AuditService audit) {
        this.repository = repository;
        this.audit = audit;
    }

    @GetMapping
    @Operation(summary = "List all appetite rules")
    public List<AppetiteRule> list() {
        return repository.findAllByOrderByIdAsc();
    }

    @GetMapping("/{id}")
    public AppetiteRule get(@PathVariable long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Rule " + id + " not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AppetiteRule create(@Valid @RequestBody AppetiteRuleRequest req,
                               @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        AppetiteRule saved = repository.save(apply(new AppetiteRule(), req));
        audit.record("APPETITE_RULE", String.valueOf(saved.getId()), "RULE_CREATED", user, describe(saved));
        return saved;
    }

    @PutMapping("/{id}")
    @Transactional
    public AppetiteRule update(@PathVariable long id, @Valid @RequestBody AppetiteRuleRequest req,
                               @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        AppetiteRule rule = get(id);
        String before = describe(rule);
        apply(rule, req);
        audit.record("APPETITE_RULE", String.valueOf(id), "RULE_UPDATED", user, before + " → " + describe(rule));
        return rule;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable long id, @RequestHeader(value = "X-User", defaultValue = "admin") String user) {
        AppetiteRule rule = get(id);
        repository.delete(rule);
        audit.record("APPETITE_RULE", String.valueOf(id), "RULE_DELETED", user, describe(rule));
    }

    private static AppetiteRule apply(AppetiteRule rule, AppetiteRuleRequest req) {
        rule.setName(req.name().trim());
        rule.setLineOfBusiness(req.lineOfBusiness());
        rule.setState(req.state() == null || req.state().isBlank() ? null : req.state());
        rule.setConstructionClass(req.constructionClass());
        rule.setMaxTiv(req.maxTiv());
        rule.setActive(req.active());
        rule.setNotes(req.notes() == null ? "" : req.notes().trim());
        return rule;
    }

    private static String describe(AppetiteRule r) {
        return "%s [%s, %s, min %s, max TIV %s, %s]".formatted(r.getName(), r.getLineOfBusiness(),
                r.getState() == null ? "any state" : r.getState(),
                r.getConstructionClass() == null ? "any" : r.getConstructionClass(),
                r.getMaxTiv().stripTrailingZeros().toPlainString(), r.isActive() ? "active" : "inactive");
    }
}
