import { Component, OnInit } from '@angular/core';
// import { NativeAudio } from '@ionic-native/native-audio/ngx';

@Component({
  selector: 'app-alarm',
  templateUrl: './alarm.page.html',
  styleUrls: ['./alarm.page.scss'],
})
export class AlarmPage implements OnInit {

  constructor() { 
    // this.nativeAudio.preloadSimple('alarmsound', 'assets/audio/alarm.mp3').then(()=>{
    // }).catch(err => {
    //   console.log(err);
    // });
  }

  ngOnInit() {
    // this.nativeAudio.play('alarmsound') 
  }
  ionViewWillLeave(){
    // this.nativeAudio.stop('alarmsound');
  }

}
