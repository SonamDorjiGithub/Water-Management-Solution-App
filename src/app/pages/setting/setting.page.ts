// import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, LoadingController} from '@ionic/angular';
import { MQTTService } from 'ionic-mqtt';
import { Storage} from '@ionic/storage-angular';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
})
export class SettingPage implements OnInit {

  host: any;
  port: number;
  clientId: any;
  subscribeTopic: any;

  private _mqttClient: any;

  private MQTT_CONFIG: {
    host: string,
    port: number,
    clientId: string,
  }; 

  ConfigDataArray: Array<string> = [];

  constructor(public alertController: AlertController,
    private storage: Storage,
    private mqttService: MQTTService,
    public loadingController: LoadingController,
    public navCtrl: NavController,
    ) { }

  ngOnInit() {
  }
  
  ionViewDidEnter(){
    this.getDataFromLocalstorage();
  }

  ionViewDidLeave(){
    console.log("ion view did leave")
    clearTimeout(this.timeOutVariable)
  }

  saveConfiguration(){
    if(this.host == null|| this.port == null || this.clientId == null || this.subscribeTopic == null) {
      this.presentAlert("Warning!","All fields are mandatory.");
    } else {
      this.presentLoading();
      console.log("Host: "+this.host+"\nPort: "+this.port+"\nClient Id: "+this.clientId+"\nTopic: "+this.subscribeTopic);
      let TOPIC: string[] = [this.subscribeTopic];
      
      this.MQTT_CONFIG = {
          host: this.host,
          port: this.port,
          clientId: this.clientId,
        }; 

      this._mqttClient = this.mqttService.loadingMqtt((error)=>{this._onConnectionLost(error)}, (msg)=>{this._onMessageArrived(msg)}, TOPIC, this.MQTT_CONFIG);
    }
  }

  private _onConnectionLost(responseObject) {
    // connection listener
    console.log("inside connection lost");
    console.log('_onConnectionLost', responseObject);
    console.log('error_code', responseObject.errorCode);
    if(responseObject.errorCode !== 8){
      this.presentAlert("Alert","Sorry! Cannot make a connection. <br> Error Code: "+responseObject.errorCode);
    }
  }

  _onMessageArrived(message) {
    this.loading.dismiss();
    clearTimeout(this.timeOutVariable);
    console.log("inside message arrive");
    console.log('message', message);
    this.MQTT_CONFIG['Topic'] = this.subscribeTopic;
    this.setDataToLocalstorage(this.MQTT_CONFIG)
    this.presentAlert("Success", "Connection has been made successfully. You may now start using the app");
  }

  loading: any;

  async presentLoading() {
    this.checkConnectionSuccess();
    this.loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 14000,
      showBackdrop: false,
      spinner: "bubbles"
    });
    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();
    console.log('Loading dismissed!');
  }

  timeOutVariable;

  checkConnectionSuccess(){
    this.timeOutVariable = setTimeout(() =>{
      console.log("failed")
      this.presentAlert("Error", "Sorry! Cannot make a connection. Please change your settings or try again after sometime.")
    }, 15000);
  }

  async presentAlert(headerMsg, msg) {
    const alert = await this.alertController.create({
      header: headerMsg,
      message: msg,
      backdropDismiss: false,
      buttons: ['OK']
    });

    await alert.present();

    const { role, data } = await alert.onDidDismiss();
    console.log('Alert dismissed!');
    if (headerMsg == 'Success') {
      console.log("successfull");
      this.navCtrl.navigateRoot('/home'); //success
      //to disconnect. Give different failed callback. Otherwise, keeps getting success message
      let NotExistTopic: string[] = ['FailedTopic'];
      this._mqttClient = this.mqttService.loadingMqtt((error)=>{this._onConnectionLostDisconnect(error)}, (msg)=>{this._onMessageArrived(msg)}, NotExistTopic, this.MQTT_CONFIG);
    }
  }

  private _onConnectionLostDisconnect(responseObject) {
    // connection listener
    console.log("inside connection lost 22");
    console.log('_onConnectionLost', responseObject);
  }

  // set a key/value
  setDataToLocalstorage(data){
    console.log(data);
    this.storage.set('keyOfData', JSON.stringify(data));
  }

  fetchedConfigData: any;

  getDataFromLocalstorage(){
    this.storage.get('keyOfData').then((data) => {
      this.fetchedConfigData = data;
      console.log(JSON.parse(this.fetchedConfigData))
      if(this.fetchedConfigData){
        let jsonFetchedData = JSON.parse(this.fetchedConfigData)
        this.host = jsonFetchedData.host;
        this.port = jsonFetchedData.port;
        this.clientId = jsonFetchedData.clientId;
        this.subscribeTopic = jsonFetchedData.Topic;
      }
    });
  }

  resetStorage(){
    this.storage.remove('keyOfData');
  }

  clearConfig() {
    this.storage.get('keyOfData').then((data) => {
      this.fetchedConfigData = data;
      if(this.fetchedConfigData) {
        this.presentAlertConfirm();
      } else {
        this.presentAlert("Warning!","No data to clear");
      }
    });
  }
  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Confirm!',
      message: 'Are you sure you want to clear the Configuration Detail?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'Yes',
          handler: () => {
            console.log('Confirm Okay');
            this.resetStorage();  //uncomment this
            this.navCtrl.navigateRoot('/home'); //success
          }
        }
      ]
    });

    await alert.present();
  }
    
}
