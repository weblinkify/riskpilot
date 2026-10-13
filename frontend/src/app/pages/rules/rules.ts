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
  template: `
    <header class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Appetite rules</h1>
        <p class="max-w-2xl text-sm text-deck-500">
          Every assessment checks the submission against these rules. State-specific rules take
          precedence over “any state” rules; construction class is a minimum. Changes apply to the
          next assessment and are audited.
        </p>
      </div>
      @if (editing() === null) {
        <button type="button" class="btn-primary" (click)="startCreate()" data-testid="new-rule">
          New rule
        </button>
      }
    </header>

    @if (editing() !== null) {
      <form
        class="card mb-5 grid gap-4 p-5 md:grid-cols-6"
        [formGroup]="form"
        (ngSubmit)="save()"
        data-testid="rule-form"
      >
        <h2 class="font-semibold md:col-span-6">
          {{ editing() === 'new' ? 'New appetite rule' : 'Edit rule' }}
        </h2>
        <label class="md:col-span-3"
          ><span class="label">Name</span>
          <input class="input" formControlName="name" data-testid="rule-name" />
          @if (invalid('name')) {
            <span class="mt-1 block text-xs text-red-700">Name is required.</span>
          }
        </label>
        <label class="md:col-span-3"
          ><span class="label">Line of business</span>
          <select class="input" formControlName="lineOfBusiness" data-testid="rule-line">
            @for (l of lines; track l) {
              <option [value]="l">{{ lineLabel[l] }}</option>
            }
          </select>
        </label>
        <label class="md:col-span-1"
          ><span class="label">State</span>
          <input
            class="input uppercase"
            formControlName="state"
            maxlength="2"
            placeholder="Any"
            data-testid="rule-state"
          />
          @if (invalid('state')) {
            <span class="mt-1 block text-xs text-red-700">Two letters, e.g. TX.</span>
          }
        </label>
        <label class="md:col-span-2"
          ><span class="label">Minimum construction class</span>
          <select class="input" formControlName="constructionClass" data-testid="rule-construction">
            <option value="">Any</option>
            @for (c of constructionClasses; track c) {
              <option [value]="c">{{ constructionLabel[c] }}</option>
            }
          </select>
        </label>
        <label class="md:col-span-2"
          ><span class="label">Max TIV (USD)</span>
          <input
            class="input"
            type="number"
            min="1"
            step="100000"
            formControlName="maxTiv"
            data-testid="rule-max-tiv"
          />
          @if (invalid('maxTiv')) {
            <span class="mt-1 block text-xs text-red-700">Must be greater than 0.</span>
          }
        </label>
        <label class="flex items-end gap-2 pb-2 md:col-span-1">
          <input
            type="checkbox"
            class="size-4 accent-deck-900"
            formControlName="active"
            data-testid="rule-active"
          /><span class="text-sm">Active</span>
        </label>
        <label class="md:col-span-6"
          ><span class="label">Notes</span>
          <input class="input" formControlName="notes" maxlength="500" />
        </label>
        @if (formError()) {
          <p class="text-sm text-red-700 md:col-span-6" role="alert">{{ formError() }}</p>
        }
        <div class="flex gap-2 md:col-span-6">
          <button type="submit" class="btn-primary" [disabled]="saving()" data-testid="save-rule">
            {{ saving() ? 'Saving…' : 'Save rule' }}
          </button>
          <button type="button" class="btn-ghost" (click)="cancel()">Cancel</button>
        </div>
      </form>
    }

    <div class="card overflow-hidden">
      <div class="relative overflow-x-auto">
        <table class="w-full min-w-[52rem]">
          <thead class="border-b border-deck-100 bg-deck-50/60">
            <tr>
              <th class="table-head">Rule</th>
              <th class="table-head">Line</th>
              <th class="table-head">State</th>
              <th class="table-head">Min. construction</th>
              <th class="table-head text-right">Max TIV</th>
              <th class="table-head">Status</th>
              <th class="table-head"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-deck-100">
            @for (r of rules.value() ?? []; track r.id) {
              <tr data-testid="rule-row">
                <td class="table-cell">
                  <div class="font-medium">{{ r.name }}</div>
                  @if (r.notes) {
                    <div class="text-xs text-deck-500">{{ r.notes }}</div>
                  }
                </td>
                <td class="table-cell whitespace-nowrap">{{ lineLabel[r.lineOfBusiness] }}</td>
                <td class="table-cell">{{ r.state ?? 'Any' }}</td>
                <td class="table-cell">
                  {{ r.constructionClass ? constructionLabel[r.constructionClass] : 'Any' }}
                </td>
                <td class="table-cell text-right tabular-nums" data-testid="rule-max-tiv-cell">
                  {{ money(r.maxTiv) }}
                </td>
                <td class="table-cell">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="
                      r.active ? 'bg-emerald-50 text-emerald-800' : 'bg-deck-100 text-deck-600'
                    "
                    >{{ r.active ? 'Active' : 'Inactive' }}</span
                  >
                </td>
                <td class="table-cell text-right whitespace-nowrap">
                  @if (confirmDelete() === r.id) {
                    <span class="text-xs text-deck-600">Delete?</span>
                    <button
                      type="button"
                      class="ml-2 text-xs font-semibold text-red-700 hover:underline"
                      (click)="remove(r)"
                      data-testid="confirm-delete"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      class="ml-2 text-xs text-deck-500 hover:underline"
                      (click)="confirmDelete.set(null)"
                    >
                      No
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="text-xs font-medium text-deck-700 hover:underline"
                      (click)="startEdit(r)"
                      data-testid="edit-rule"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="ml-3 text-xs font-medium text-red-700 hover:underline"
                      (click)="confirmDelete.set(r.id)"
                      data-testid="delete-rule"
                    >
                      Delete
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (rules.error()) {
        <p class="p-4 text-sm text-red-700" role="alert">
          Could not load rules: {{ rules.error()?.message }}
        </p>
      }
    </div>
  `,
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
