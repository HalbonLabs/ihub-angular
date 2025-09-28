import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  @Input() diameter: number = 40;
  @Input() message?: string;
  @Input() overlay: boolean = false;
  @Input() fullScreen: boolean = false;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}
}
