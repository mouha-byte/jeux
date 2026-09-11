import {ContextAudio} from './context-audio';
export class ChessSound{
 private audio=new ContextAudio('chess');
 play(kind:'move'|'capture'|'check'|'win'|'click'){void this.audio.play(kind)}
 mute(muted:boolean){this.audio.setSound(!muted)}
 close(){this.audio.stop()}
}
