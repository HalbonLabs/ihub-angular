import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NavigationTile {
  path: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  badge?: number;
  description: string;
}

@Component({
  selector: 'app-tile-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="onClick.emit()"
      class="group relative flex flex-col items-center justify-center p-8 rounded-xl
             bg-white border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg
             transition-all duration-300 transform hover:-translate-y-1 hover:scale-105
             focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2
             aspect-square min-w-[200px] overflow-hidden">

      <!-- Subtle Background Pattern -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-white pointer-events-none"></div>

      <!-- Notification Badge -->
      <span
        *ngIf="tile.badge && tile.badge > 0"
        class="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold
               px-2.5 py-1.5 rounded-full shadow-lg border-2 border-white
               animate-pulse z-10 min-w-[28px] h-7 flex items-center justify-center">
        {{ tile.badge }}
      </span>

      <!-- Icon Container with Color-Coded Background -->
      <div class="relative z-10 flex flex-col items-center mb-6">
        <div
          [class]="'bg-gradient-to-br ' + tile.color + ' rounded-3xl p-6 mb-3 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110 flex items-center justify-center w-24 h-24'">
          <i
            [class]="tile.icon + ' text-5xl text-white drop-shadow-sm flex-shrink-0'"
            style="line-height: 1; display: flex; align-items: center; justify-content: center;">
          </i>
        </div>
      </div>

      <!-- Content -->
      <div class="relative z-10 text-center space-y-2">
        <div class="text-xl font-bold text-gray-900 leading-tight">{{ tile.title }}</div>
        <div class="text-gray-600 text-sm font-medium leading-relaxed px-3">{{ tile.subtitle }}</div>
      </div>

      <!-- Hover Border Effect -->
      <div
        class="absolute inset-0 rounded-xl border-2 border-transparent
               group-hover:border-blue-200 transition-all duration-300 pointer-events-none">
      </div>
    </button>
  `,
  styles: [`
    /* Ensure FontAwesome icons are loaded */
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
  `]
})
export class TileCardComponent {
  @Input() tile!: NavigationTile;
  @Output() onClick = new EventEmitter<void>();
}
