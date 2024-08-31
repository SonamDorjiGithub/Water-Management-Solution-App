import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { IonicMqttModule, MQTTService } from 'ionic-mqtt';

import {HttpClientModule, HttpClient} from "@angular/common/http";
// import { NativeAudio } from '@ionic-native/native-audio';
import { NativeAudio } from '@ionic-native/native-audio/ngx';
import { IonicStorageModule, Storage } from '@ionic/storage-angular';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    IonicMqttModule,
    HttpClientModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    NativeAudio,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    MQTTService,
    Storage
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
