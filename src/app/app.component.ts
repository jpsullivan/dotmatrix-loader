import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DotsHoverBlockComponent } from './dots/dots-hover-block.component';
import { DotsHoverGroupComponent } from './dots/dots-hover-group.component';
import { DotsComponent } from './dots/dots.component';
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
    DotsComponent,
    DotsHoverBlockComponent,
    DotsHoverGroupComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'matrixloader';
}
