import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'date-picker',
  standalone: false,
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css'
})
export class DatePickerComponent {

  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Output() dateChange = new EventEmitter<Date>();
  // Form group with custom validator
  filterForm = new FormGroup({
    required: new FormControl('', [
      Validators.required,
    ])
  });

  selectedDate: Date = new Date();

  onDateChange(event: any): void {
    this.selectedDate = event.value;
    this.dateChange.emit(this.selectedDate);
  }


}
