import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InspectionsListComponent } from './components/inspections-list/inspections-list.component';
import { InspectionDetailComponent } from './components/inspection-detail/inspection-detail.component';
import { InspectionFormComponent } from './components/inspection-form/inspection-form.component';

const routes: Routes = [
  {
    path: '',
    component: InspectionsListComponent
  },
  {
    path: 'new',
    component: InspectionFormComponent
  },
  {
    path: ':id',
    component: InspectionDetailComponent
  },
  {
    path: ':id/edit',
    component: InspectionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InspectionsRoutingModule { }
