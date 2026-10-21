import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, AppetiteRule, AppetiteRuleInput, errorMessage } from '../../core/api.service';
import {
  CONSTRUCTION_CLASSES,
  CONSTRUCTION_LABEL,
  LINES,
  LINE_LABEL,
  usd,
} from '../../core/format';
import type { ConstructionClass, LineOfBusiness } from '../../graphql/schema-types.generated';

@Component({
  selector: 'rp-rules',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rules.html',
})
export class Rules {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly rules = rxResource({ stream: () => this.api.rules() });
  protected readonly editing = signal<number | 'new' | null>(null);
  protected readonly confirmDelete = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly lines = LINES;
  protected readonly lineLabel = LINE_LABEL;
  protected readonly constructionClasses = CONSTRUCTION_CLASSES;
  protected readonly constructionLabel = CONSTRUCTION_LABEL;
  protected readonly money = usd;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    lineOfBusiness: ['PROPERTY' as LineOfBusiness, Validators.required],
    state: ['', Validators.pattern(/^[A-Za-z]{2}$/)],
    constructionClass: ['' as ConstructionClass | ''],
    maxTiv: [10_000_000, [Validators.required, Validators.min(1)]],
    active: [true],
    notes: [''],
  });

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected startCreate(): void {
    this.form.reset();
    this.formError.set(null);
    this.editing.set('new');
  }

  protected startEdit(r: AppetiteRule): void {
    this.form.setValue({
      name: r.name,
      lineOfBusiness: r.lineOfBusiness,
      state: r.state ?? '',
      constructionClass: r.constructionClass ?? '',
      maxTiv: r.maxTiv,
      active: r.active,
      notes: r.notes,
    });
    this.formError.set(null);
    this.editing.set(r.id);
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: AppetiteRuleInput = {
      name: v.name.trim(),
      lineOfBusiness: v.lineOfBusiness,
      state: v.state ? v.state.toUpperCase() : null,
      constructionClass: v.constructionClass || null,
      maxTiv: Number(v.maxTiv),
      active: v.active,
      notes: v.notes,
    };
    const target = this.editing();
    this.saving.set(true);
    const req =
      target === 'new' ? this.api.createRule(body) : this.api.updateRule(target as number, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.rules.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(errorMessage(e));
      },
    });
  }

  protected remove(r: AppetiteRule): void {
    this.api.deleteRule(r.id).subscribe({
      next: () => {
        this.confirmDelete.set(null);
        this.rules.reload();
      },
      error: (e) => this.formError.set(errorMessage(e)),
    });
  }
}
