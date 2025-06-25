import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectOption } from '../modules/user/user.model';
import { DataService } from 'src/app/Services/data-service';
@Component({
  selector: 'forms-select',
  standalone: false,
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
})
export class SelectComponent implements OnInit {
  @Input() required: boolean = false;
  @Input() placeholder: string = '';
  @Input() options: SelectOption[] = [];
  @Input() hint: string = '';
  @Input() api: string = '';
  @Output() selectionChange = new EventEmitter<any>();

  filterForm = new FormGroup({
    required: new FormControl(null, [Validators.required]), // Initialize with null
  });

  loader: boolean = false;
  initialRender: boolean = false;
  selectKey: string;
  selectValue: string;
  selectedValue: any = null;
  constructor(private dataService: DataService) {}
  ngOnInit(): void {
    if (this.options?.length === 1) {
      this.selectKey = this.options[0].value;
      this.selectValue = this.options[0].label;
      this.options = [];
    } else this.initialRender = true;
  }

  async onSelectClick() {
    if (!this.initialRender) {
      this.loader = true;
      try {
        // Updated get request using dataService
        this.dataService.get<any>(this.api).subscribe({
          next: (res) => {
            if (res) {
              this.options = res.map((option: any) => ({
                value: option[this.selectKey],
                label: option[this.selectValue],
              }));
            } else {
              this.options = [
                {
                  value: 'No Records Available',
                  label: 'No Records Available',
                },
              ];
            }
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            this.options = [
              {
                value: 'No Records Available',
                label: 'No Records Available',
              },
            ];
          },
          complete: () => {
            this.loader = false;
            this.initialRender = true;
          },
        });
      } catch (error) {
        console.error('Unexpected error:', error);
        this.options = [
          {
            value: 'No Records Available',
            label: 'No Records Available',
          },
        ];
        this.loader = false;
        this.initialRender = true;
      }
    }
  }
  onValueChange(event: any): void {
    this.selectedValue = event.value;
    this.selectionChange.emit(event.value);
  }
}
