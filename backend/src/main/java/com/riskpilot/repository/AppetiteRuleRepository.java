package com.riskpilot.repository;

import com.riskpilot.domain.AppetiteRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppetiteRuleRepository extends JpaRepository<AppetiteRule, Long> {
    List<AppetiteRule> findAllByOrderByIdAsc();
}
