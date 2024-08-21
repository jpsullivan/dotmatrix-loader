import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LetterLoaderComponent } from './letterloader/letterloader.component';
import { MatrixloaderComponent } from './matrixloader/matrixloader.component';
import { MockChatComponent } from './mock-chat/mock-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatrixloaderComponent,
    LetterLoaderComponent,
    MockChatComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'matrixloader';
}
