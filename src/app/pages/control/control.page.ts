import { Component, OnInit } from '@angular/core';
import { MQTTService } from 'ionic-mqtt';
import { ToastController, LoadingController, NavController, AlertController } from '@ionic/angular';
import { ItemService } from '../../services/item.service';
import { Storage} from '@ionic/storage-angular';

@Component({
  selector: 'app-control',
  templateUrl: './control.page.html',
  styleUrls: ['./control.page.scss'],
})
export class ControlPage implements OnInit {

  private _mqttClient: any;

  private TOPIC: string[] = ['XXXX/Control', 'XXXX/DATA'];

  selectedflowName: any;
  selectedflowIndex: any;
  fetchedRangeValue: number;
  fetchedStatus: string;
  selectedRangeValue: number;

  rangeControlMax : number = 100
  rangeControlStep : number = 5

  //mqtt config
  host: any;
  port: number;
  clientId: any;

  private MQTT_CONFIG: {
    host: string,
    port: number,
    clientId: string,
  };

  responseFromNodeName: any;

  showProgressBar: boolean = false

  constructor(private mqttService: MQTTService,
    public toastController: ToastController,
    private itemService: ItemService,
    private storage: Storage,
    public navCtrl: NavController,
    public alertController: AlertController,
    ) { 
    }

  ngOnInit() {
    // this.getDataFromLocalstorage();
  }
  
  ionViewDidLeave(){
    console.log("ion view did leave")
    let NotExistTopic: string[] = ['FailedTopic'];
    this._mqttClient = this.mqttService.loadingMqtt((error)=>{this._onConnectionLostDisconnect(error)}, (msg)=>{this._onMessageArrived(msg)}, NotExistTopic, this.MQTT_CONFIG);
    console.log("VALUE on leave: "+this.selectedflowIndex);
    this.showProgressBar = false
  }

  private _onConnectionLostDisconnect(responseObject) {
    // connection listener
    console.log("inside connection lost 22");
    console.log('_onConnectionLost', responseObject);
  }

  async ionViewDidEnter(){
    console.log("VALUE on load: "+this.selectedflowIndex);
    console.log("ion view did load")
    this.selectedRangeValue = this.fetchedRangeValue;
    await this.getDataFromLocalstorage();
    this.getData();
  }

  private _onConnectionLost(responseObject) {
    console.log("inside connection lost");
    console.log('_onConnectionLost', responseObject);
    this.showProgressBar = false
  }

  private _onMessageArrived(message) {
    console.log("inside message arrive");
    console.log('message', message);
    // console.log('message topic', message.destinationName);
    if(message.destinationName === 'XXXX/Control') {
      let payloadStringResponse = message.payloadString ? message.payloadString : '' //if empty
      // payloadStringResponse = '0400'
      let responseFromGcitControlTopic = payloadStringResponse.substr(0, 4)
      let firstTwoDigitCode = responseFromGcitControlTopic.substr(0, 2)
      let lastTwoDigitCode = responseFromGcitControlTopic.substr(2, 4)
      console.log(responseFromGcitControlTopic)
      console.log("first two digit: "+firstTwoDigitCode)  //if first digit 99, Network Address Not Found
      console.log("last two digit: "+lastTwoDigitCode)
      this.checkErrorCodeFirstTwoDigit(firstTwoDigitCode)
      this.checkErrorCodeLastTwoDigit(lastTwoDigitCode)
    } else if(message.destinationName === 'XXXX/DATA'){
      //assign actual valve position
      let jsonMessageResponse = JSON.parse(message.payloadString);
      this.getFlowRateDetail(jsonMessageResponse)
      //to change value in view
      this.fetchedRangeValue = this.valvePositionArrayFromServer[this.selectedflowIndex] //new approach to get exact value
      // this.selectedRangeValue = this.fetchedRangeValue; avoid changing range control
      console.log("Node name: "+this.nodeNameGlobal+" valve name: "+this.valveNameGlobal)
      if(this.nodeNameGlobal){
        console.log("Node name: "+this.nodeNameGlobal+" valve name: "+this.valveNameGlobal)
        // let noFeedbackValve = []
        this.logActivity(this.nodeNameGlobal, this.valveNameGlobal, this.fetchedRangeValue)
      } else {
        console.log("here")
      }
    }
  }

  public async publishMessage(topic, payload) {
    console.log('publishMessage')
    // this.mqttService.sendMessage("ROYAL", "Bc0");
    await this.mqttService.sendMessage(topic, payload);
    return "success"
  }

  public getResponseMessage(){
    console.log("get response message callback")
    //connect new
  }

  nodeNameGlobal: any;
  valveNameGlobal: any;

  sendMessage() {
    console.log("inside send message: "+this.selectedflowName)
    let nodeName = this.selectedflowName.split("-")[0];
    let valveName = this.selectedflowName.split("-")[1];
    this.nodeNameGlobal = nodeName
    this.valveNameGlobal = valveName 
    let publishMessagePayload; // A for valve A and B for valve B
    let valveCode: any //r = reduce or i = increase or c = close
    let difference = this.selectedRangeValue - this.fetchedRangeValue;  //compare selectedRangeValue and the fetched value
    if(difference >= 0 ) {
      valveCode = 'i'
    } else if (difference < 0 && this.selectedRangeValue !== 0) {
      valveCode = 'r'
    } else if (this.selectedRangeValue == 0) {
      valveCode = 'c';
    }
    publishMessagePayload = valveName+valveCode+Math.abs(this.selectedRangeValue);
    console.log("publish message: "+publishMessagePayload);
    this.presentToast("Payload message: "+publishMessagePayload+" TOPIC: "+nodeName);
    //log data here
    this.logActivity(nodeName, valveName, this.selectedRangeValue)
    // const publishPromise = this.publishMessage('testtopicfinal', publishMessagePayload); //(topic, payload) //topic should be nodename
    const publishPromise = this.publishMessage(nodeName, publishMessagePayload); //(topic, payload) //topic should be nodename

    publishPromise.then((data)=> {
      console.log(data)
      // this.getResponseMessage();
    })
    this.showProgressBar = true
    // this.mqttService.sendMessage(topic, payload);
  }

  onChangeFlow() {
    console.log("VALUE: "+this.selectedflowIndex);
    if(this.selectedflowIndex == 7 || this.selectedflowIndex == 12){ //disable for Royal b and desup b
      this.presentAlert("Warning","You cannot control this node from the mobile app. Please use the web application");
    } else {
      // console.log("valve name: "+this.valveData['data'][this.selectedflowName].valve_name)
      this.selectedflowName = this.valveData['data'][this.selectedflowIndex].node_name+"-"+this.valveData['data'][this.selectedflowIndex].valve_name;
      // this.fetchedRangeValue = this.valveData['data'][this.selectedflowIndex].valve_percent; //this.selectedflowName, returning array index  
      this.fetchedRangeValue = this.valvePositionArrayFromServer[this.selectedflowIndex] //new approach to get exact value
      this.selectedRangeValue = this.fetchedRangeValue;
      this.fetchedStatus = this.valveData['data'][this.selectedflowIndex].valve_status;
      this.showProgressBar = false
      let justOpenAndCloseValveArray = [7, 8, 11, 12, 6] 
      // console.log("INDEX TYPE: "+typeof(parseInt(this.selectedflowIndex)))
      if(justOpenAndCloseValveArray.includes(parseInt(this.selectedflowIndex))){
        this.rangeControlMax = 1
        this.rangeControlStep = 1
      } else {
        this.rangeControlMax = 100
        this.rangeControlStep = 5
      }
    }
    
  }

  logActivity(nodeName: any, valveName: any, valvePercentage: any){
    this.itemService.logActivity(nodeName, valveName, valvePercentage).then(data=>
      {
        console.log(data);
        
      }).catch((error)=>
      {
        //do nothing
      });
  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

  valveData : any;

  getData(){
    console.log("here in calling");
    this.itemService.getDetail().then(data => {
      this.valveData = data;
      console.log("TYPE: "+typeof(this.valveData['data']));
      console.log("DATA: "+this.valveData['data'][0].node_name);
      console.log(this.valveData['data'][0].node_name+'-'+this.valveData['data'][0].valve_name);
      this.assignDataArray(this.valveData['data'])
    }).catch((error) =>
      {
        console.log("no connection or error"+error);
      });
  }

  nodeValveNameArray: string[] = [];
  valvePositionArray: number[] = [];
  valveStatusArray: string[] = [];

  flowRateValvePositionArray: number[] = [];
  valvePositionArrayFromServer: number[] = [];

  valvePositionRoyalB: number;
  valvePositionDesupB: number;

  assignDataArray(msg) {
    console.log("inside assigndata array")
    console.log(msg)
    // this.selectedflowName = msg[0].node_name+'-'+msg[0].valve_name; //assign default value
    this.selectedflowName = 'SELECT FLOW' //assign default value

    // this.fetchedRangeValue = msg[0].valve_percent; //old one
    // this.fetchedRangeValue = this.valvePositionArrayFromServer[0];
    
    if(!this.selectedflowIndex){
      this.fetchedRangeValue = 0;
    }

    this.selectedRangeValue = this.fetchedRangeValue;
    this.fetchedStatus = msg[0].valve_status;

    for (let i = 0; i < 15; i++) {
      this.nodeValveNameArray.push(msg[i].node_name+'-'+msg[i].valve_name);
      this.valvePositionArray.push(parseInt(msg[i].valve_percent)); //no more used. Used only for valve without feedback
      this.valveStatusArray.push(msg[i].valve_status);
    }
    console.log(this.valvePositionArray);
    console.log("Royal B"+this.valvePositionArray[7]);
    this.valvePositionRoyalB = this.valvePositionArray[7] //for Royal B, fetch from DB, not MQTT data
    this.valvePositionDesupB = this.valvePositionArray[12] //for Desup B, fetch from DB, not MQTT data
  }

  fetchedConfigData: any;

  getDataFromLocalstorage(){
    this.storage.get('keyOfData').then((data) => {
      this.fetchedConfigData = data;
      console.log(JSON.parse(this.fetchedConfigData))
      let jsonFetchedData = JSON.parse(this.fetchedConfigData)
      // this.TOPIC = [jsonFetchedData.Topic];

      this.MQTT_CONFIG = {
        host: jsonFetchedData.host,
        port: jsonFetchedData.port,
        clientId: jsonFetchedData.clientId,
      };
      this._mqttClient = this.mqttService.loadingMqtt(this._onConnectionLost, (msg)=>{this._onMessageArrived(msg)}, this.TOPIC, this.MQTT_CONFIG);
    });
  }

  isSuccess : boolean;
  responseMessage: string;

  public checkErrorCodeLastTwoDigit(responseNumber: string) {
      switch(responseNumber){
        case '00':
          this.isSuccess = true
          this.responseMessage = 'Success'
          break;
        case 'E1':
          this.isSuccess = false
          this.responseMessage = 'XOR Check Error'
          break;
        case '99':
          this.isSuccess = false
          this.responseMessage = 'XOR Check Error'
          break;
        case 'E4':
          this.isSuccess = false
          this.responseMessage = 'Security Check Failed'
          break;
        case 'E5':
          this.isSuccess = false
          this.responseMessage = 'MAC frame long error'
          break;
        case 'E6':
          this.isSuccess = false
          this.responseMessage = 'Invalid Parameter'
          break;
        case 'E7':
          this.isSuccess = false
          this.responseMessage = 'DID not receive ACK'
          break;
        case 'EA':
          this.isSuccess = false
          this.responseMessage = 'Transmitter is busy'
          break;
        case 'C1':
          this.isSuccess = false
          this.responseMessage = 'Network Layer Invalid Parameter'
          break;
        case 'C2':
          this.isSuccess = false
          this.responseMessage = 'Invalid Request'
          break;
        case 'C7':
          this.isSuccess = false
          this.responseMessage = 'No Route Found'
          break;
        case 'D1':
          this.isSuccess = false
          this.responseMessage = 'Buffer Busy'
          break;
        case 'D2':
          this.isSuccess = false
          this.responseMessage = 'APS layer did not receive ACK'
          break;
        case 'D3':
          this.isSuccess = false
          this.responseMessage = 'APS frame is too long'
          break;
        default:
          this.isSuccess = false
          this.responseMessage = 'Strange Error Code'
      }
      console.log("message: "+this.responseMessage)
      console.log("error code: "+responseNumber)
  }

  checkErrorCodeFirstTwoDigit(responseNumberFirstTwoDigit: string){
    switch (responseNumberFirstTwoDigit) {
      case '01':
        this.responseFromNodeName = 'BHU'
        break;
      case '02':
        this.responseFromNodeName = 'KHPC'
        break;
      case '03':
        this.responseFromNodeName = 'RBP'
        break;
      // 04 is from gateway and should be ignored
      case '05':
        this.responseFromNodeName = 'SCHOOL'
        break;
      case '06':
        this.responseFromNodeName = 'TRIJUNCTION'
        break;
      case '07':
        this.responseFromNodeName = 'TOWN'
        break;
      case '08':
        this.responseFromNodeName = 'SOURCE'
        break;
      case '09':
        this.responseFromNodeName = 'ROYAL'
        break;
      case '10':
        this.responseFromNodeName = 'DESUPTANK'
        break;
      default:
        this.responseFromNodeName = 'Error'
    }
    console.log("From node: "+this.responseFromNodeName)
  } 

  getFlowRateDetail(msg) {
    console.log("inside get flow rate")
    this.flowRateValvePositionArray = []; 
    
    for (let i = 1; i <= 18; i++) {
      let messageDValue = 'd_'+i;
      this.flowRateValvePositionArray.push(msg[messageDValue].valve_position);       
    }
    console.log("flow rate valve position: "+this.flowRateValvePositionArray);
    console.log("valve position array 1: "+this.flowRateValvePositionArray[1]);
    this.assignActualValvePosition()
  }

  assignActualValvePosition(){
    this.valvePositionArrayFromServer[0] = this.flowRateValvePositionArray[1]
    this.valvePositionArrayFromServer[1] = this.flowRateValvePositionArray[0]
    this.valvePositionArrayFromServer[2] = this.flowRateValvePositionArray[3]
    this.valvePositionArrayFromServer[3] = this.flowRateValvePositionArray[2]
    this.valvePositionArrayFromServer[4] = this.flowRateValvePositionArray[5]
    this.valvePositionArrayFromServer[5] = this.flowRateValvePositionArray[7]
    this.valvePositionArrayFromServer[6] = this.flowRateValvePositionArray[12]
    // this.valvePositionArrayFromServer[7] = this.flowRateValvePositionArray[15] //No feedback from royal B
    // this.valvePositionArrayFromServer[7] = this.selectedRangeValue //No feedback from royal B
    this.valvePositionArrayFromServer[7] = this.valvePositionRoyalB //No feedback from royal B
    this.valvePositionArrayFromServer[8] = this.flowRateValvePositionArray[14]
    this.valvePositionArrayFromServer[9] = this.flowRateValvePositionArray[9]
    this.valvePositionArrayFromServer[10] = this.flowRateValvePositionArray[8]
    this.valvePositionArrayFromServer[11] = this.flowRateValvePositionArray[17]
    // this.valvePositionArrayFromServer[12] = this.flowRateValvePositionArray[16]//No feedback from desup B
    // this.valvePositionArrayFromServer[12] = this.selectedRangeValue//No feedback from desup B
    this.valvePositionArrayFromServer[12] = this.valvePositionDesupB//No feedback from desup B
    this.valvePositionArrayFromServer[13] = this.flowRateValvePositionArray[11]
    this.valvePositionArrayFromServer[14] = this.flowRateValvePositionArray[10]
    console.log(this.valvePositionArrayFromServer)
    // this.fetchedRangeValue = this.valvePositionArrayFromServer[0]; //to assign after loading
    // this.selectedRangeValue = this.fetchedRangeValue;
  }

  goHome(){
    this.navCtrl.navigateRoot('/home'); //success
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
    if (headerMsg == 'Warning') {
      this.selectedflowIndex = 0
    }
  }
}
