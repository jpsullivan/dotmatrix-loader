import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, delay, scan } from 'rxjs/operators';
import { MatrixloaderComponent } from '../matrixloader/matrixloader.component';

@Component({
  selector: 'app-mock-chat',
  standalone: true,
  imports: [CommonModule, MatrixloaderComponent],
  template: `
    <div class="w-full h-full prose">
      <span class="text-sm">{{ message$ | async }}</span>
    </div>
  `,
  styles: [
    `
      p {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    `,
  ],
})
export class MockChatComponent {
  message$: Observable<string>;
  loremIpsum: string =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

  constructor() {
    this.message$ = this.streamText(this.loremIpsum.split(' '));
  }

  streamText(words: string[]): Observable<string> {
    return of(...words).pipe(
      concatMap((word) => of(word).pipe(delay(this.getRandomDelay()))), // Adjust the delay as needed
      scan((acc, word) => `${acc} ${word}`)
    );
  }

  private getRandomDelay(): number {
    return Math.floor(Math.random() * (150 - 30 + 1)) + 30;
  }
}
