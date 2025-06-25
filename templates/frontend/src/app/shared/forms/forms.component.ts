import { Component, Inject, Injector, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-forms',
  standalone: false,
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.css'
})
export class FormsComponent implements OnInit {
  dialogWidth: number; // Dialog width dynamically takes the width of the dialog, its width is initilized in the ngOnInit
  filterForm: FormGroup; // this filter form is used for validations of required, email address checking etc
  seachValue: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, // Data passed to the dialog i.e config etc
    private injector: Injector, // Injector to create dynamic components
    public dialogRef: MatDialogRef<FormsComponent> // MatDialogRef to close the dialog
  ) {
    const formControls: { [key: string]: FormControl } = {};
    this.data.config.fields.forEach((field: any) => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.placeholder === 'Email Address') {
        validators.push(Validators.email);
      }
      formControls[field.placeholder] = new FormControl(field.value || '', validators);
    });
    this.filterForm = new FormGroup(formControls);
  }


  ngOnInit(): void {
    const dialogContainer = this.dialogRef['_containerInstance']?.['_elementRef']?.nativeElement;
    if (dialogContainer) {
      const dimensions = dialogContainer.getBoundingClientRect();
      this.dialogWidth = dimensions.width - 50;
    }
    if (this.data.config.fields.length > 0) {
      this.data.config.fields.forEach((field: any, index: number) => {
        if (field.isCompositeField) {
          const previousFieldId = this.data.config.fields[index - 1]?.options[0].value;
          this.data.config.fields[index].componentData.api += `?${previousFieldId}=`;
        }
      });
    }
  }
  createInjector(field: any): Injector {
    return Injector.create({
      providers: [
        { provide: 'componentData', useValue: field.componentData || {} }
      ],
      parent: this.injector
    });
  }

  onSave(): void {
    const canClose = this.data.canClose ? this.data.canClose('save', this.data.config) : true;
    if (canClose) {
      this.dialogRef.close(true);
    } else {
      console.log('Dialog close prevented by config.');
    }
  }


  onCancel(): void {
    const canClose = this.data.canClose ? this.data.canClose('cancel', this.data.config) : true;
    if (canClose) {
      this.dialogRef.close(false);
    } else {
      console.log('Dialog close prevented by config.');
    }
  }
  shouldShowField(field: any, index: number): boolean {
    const previousField = this.data.config.fields[index - 1];
    if (field.isCompositeField && (previousField?.value === '' || previousField?.value === null || previousField?.value === undefined)) {
      field.value = '';
      return false;
    }
      // If the previous field has a valid value, update the composite field's API
  if (field.isCompositeField && previousField?.value) {
    const valueToInsert = previousField.value;
    // Update the API by replacing or appending the value after '='
    if (field.componentData?.api.includes('=')) {
      field.componentData.api = field.componentData.api.replace(/=.*$/, `=${valueToInsert}&`);
    } else {
      field.componentData.api += `=${valueToInsert}&`;
    }
  }

    return true;
  }

  isDisable() {
    const hasEmptyRequiredField = this.data.config.fields.some((field: any) => {
      return field.required === true && (field.value === '' || field.value === undefined);
    });

    return hasEmptyRequiredField;
  }

  openAddNewDialog(config: any) {
    this.data.handleInnerFormOpen(config); // this will open the inner form
  }



}


