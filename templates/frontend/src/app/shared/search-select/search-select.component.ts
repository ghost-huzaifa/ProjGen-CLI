import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectOption } from '../modules/user/user.model';
import { DataService } from 'src/app/Services/data-service';

@Component({
  selector: 'search-select',
  standalone: false,
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.css',
})
export class SearchSelectComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() options: SelectOption[] = [];
  @Input() hint: string = '';
  @Input() api: string = '';
  @Input() perPage: number;
  @Output() selectionChange = new EventEmitter<any>();

  selectedOptionControl = new FormControl();
  pageNumber: number = 1;
  loader: boolean = true;
  initialRender: boolean = false;
  selectKey: string;
  selectValue: string;
  private inputSubject = new Subject<string>();
  filterForm = new FormGroup({
    required: new FormControl(null, [Validators.required]),
  });

  constructor(private dataService: DataService) {}

  ngOnInit() {
    if (this.options?.length === 1) {
      this.selectKey = this.options[0].value;
      this.selectValue = this.options[0].label;
      this.options = [];
    } else {
      this.options = [];
    }
    this.loader = true;
    this.initialRender = false;
    this.inputSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((inputValue) => {
        this.fetchData(inputValue);
      });
  }

  async onSelectClick() {
    if (!this.initialRender) {
      await this.fetchData();
    }
  }

  displayFn(option: any): string {
    return option ? option.label : '';
  }

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.inputSubject.next(inputValue);
  }

  async fetchData(inputValue?: string) {
    this.loader = true;
    try {
      let apiSearch = '';
      if (this.api.includes('?')) {
        apiSearch += this.api;
      } else {
        apiSearch += this.api + '?';
      }

      if (inputValue) {
        apiSearch += `search=${inputValue}&`;
      }
      if (this.perPage) {
        apiSearch += `per_page=${this.perPage}&`;
      }
      this.dataService.get<any>(apiSearch).subscribe({
        next: (res) => {
          if (res) {
            if (this.perPage && res.records?.length > 0) {
              this.options = res.records.map((option: any) => ({
                value: option[this.selectKey],
                label: option[this.selectValue],
              }));
            } else {
              this.options = res.map((option: any) => ({
                value: option[this.selectKey],
                label: option[this.selectValue],
              }));
            }
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
          if (this.options.length === 0) {
            this.options = [
              {
                value: 'No Records Available',
                label: 'No Records Available',
              },
            ];
          }
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

  emptySearch(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedOptionControl.setValue(null);
    this.selectionChange.emit(null);
  }

  onOptionSelected(event: any): void {
    this.selectionChange.emit(event.option.value.value);
  }
  ngOnDestroy(): void {
    this.options = [];
    this.options[0] = { value: this.selectValue, label: this.selectKey };
  }
}
