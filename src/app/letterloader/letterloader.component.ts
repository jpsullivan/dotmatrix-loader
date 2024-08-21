import { AsyncPipe, NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

@Component({
  selector: 'app-letter-loader',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  template: `
    <div #containerRef class="h-full w-full text-center">
      <div
        class="break-all font-mono text-[8px] leading-3 tracking-[1.2px] text-slate-400"
      >
        {{ characters }}
      </div>
    </div>
  `,
})
export class LetterLoaderComponent implements OnInit, OnDestroy {
  @ViewChild('containerRef', { static: true }) containerRef!: ElementRef;

  characters: string = '';

  private intervalSubscription: Subscription = new Subscription();

  ngOnInit(): void {
    const element = this.containerRef.nativeElement;
    const { width, height } = element.getBoundingClientRect();
    const charCount = Math.floor((width * height) / 66);

    this.intervalSubscription = interval(150)
      .pipe(map(() => this.generateRandomCharacters(charCount)))
      .subscribe((chars) => (this.characters = chars));
  }

  ngOnDestroy(): void {
    this.intervalSubscription.unsubscribe();
  }

  private generateRandomCharacters(length: number): string {
    return Array.from({ length })
      .map(() =>
        ALPHANUMERIC_CHARS.charAt(
          Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)
        )
      )
      .join('');
  }
}
