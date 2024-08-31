import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { MQTTService } from 'ionic-mqtt';
import { Chart } from 'chart.js';
import { LoadingController, AlertController } from '@ionic/angular';
import { Storage} from '@ionic/storage-angular';
// import { NativeAudio } from '@ionic-native/native-audio/ngx';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
})

export class OverviewPage implements OnInit {

  @ViewChild('barChart', { static: true }) barChart: ElementRef;

  bars: any;
  private _mqttClient: any;

  testDataPayloadstring = {"doc_num":18,"d_1":{"time":"2022-10-21T16:21:26","flow_name":"Police_end1","flow_rate":"6.49   ","total_flow":"0.03   ","valve_position":0},"d_2":{"time":"2022-10-21T16:21:26","flow_name":"Police_Col1","flow_rate":"18.38  ",
  "total_flow":"236.00 ","valve_position":'N'},"d_3":{"time":"2022-10-21T16:19:57","flow_name":"Bhu_Police2","flow_rate":"0.00   ","total_flow":"0.00   ","valve_position":63},"d_4":{"time":"2022-10-21T16:19:57","flow_name":"Bhu_Col2",
  "flow_rate":"21.13  ","total_flow":"2160.00","valve_position":100},"d_5":{"time":"2022-10-21T16:23:51","flow_name":"School_Bhu3","flow_rate":"4.27   ","total_flow":"378.59 ","valve_position":"N"},"d_6":{"time":"2022-10-21T16:23:51",
  "flow_name":"School_Col3","flow_rate":"0.00   ","total_flow":"0.00   ","valve_position":86},"d_7":{"time":"2022-10-21T16:23:18","flow_name":"Town_School4","flow_rate":"0.000  ","total_flow":"0.000       ","valve_position":"N"},
  "d_8":{"time":"2022-10-21T16:23:18","flow_name":"Town_Line4","flow_rate":"25.000 ","total_flow":"0.000       ","valve_position":48},"d_9":{"TIME":"2033-33-33T33:30:00","flow_name":"Tri_Town5","flow_rate":"0.000  ",
  "total_flow":"0.000       ","valve_position":50},"d_10":{"time":"2033-33-33T33:30:00","flow_name":"Lower_Town5","flow_rate":"113.500","total_flow":"7264.000    ","valve_position":0},"d_11":{"time":"2022-10-10T02:13:02",
  "flow_name":"Kst_In6","flow_rate":"59.13  ","total_flow":"503.95 ","valve_position":53},"d_12":{"time":"2022-10-10T02:13:02","flow_name":"Kst_Tank6","flow_rate":"57.22  ","total_flow":"573.55 ","valve_position":54},
  "d_13":{"time":"12.34","flow_name":"Depong7","flow_rate":"13.45","total_flow":"15.69","valve_position":24},"d_14":{"time":"12.34","flow_name":"Tsangkhar7","flow_rate":"14.78","total_flow":"15.69","valve_position":"N"},
  "d_15":{"time":"15.69","flow_name":"Royal_Tank8","flow_rate":"15.69","total_flow":"15.69","valve_position":76},"d_16":{"time":"15.69","flow_name":"Public_InR9","flow_rate":"15.69","total_flow":"15.69","valve_position":15},
  "d_17":{"time":"15.69","flow_name":"Public_InL9","flow_rate":"15.69","total_flow":"15.69","valve_position":0},"d_18":{"time":"15.69","flow_name":"Public_Out9","flow_rate":"15.69","total_flow":"15.69","valve_position":69},
  "l_n":2,"l_1":{"time":"15.69","level_name":"Royal_Level","level":"0.638"},"l_2":{"time":"15.69","level_name":"Public_Level","level":"0.802"},"w_n":3,"Q_1":{"Quality_name":"TDS","time":"12.34","value":"0.69"},"Q_2":{"Quality_name":"PH",
  "time":"12.34","value":"705"},"Q_3":{"Quality_name":"Turbidity","time":"12.34","value":"15.69"}}

  //mqtt config
  host: any;
  port: number;
  clientId: any;
  private TOPIC: string[];

  private MQTT_CONFIG: {
    host: string,
    port: number,
    clientId: string,
  };

  tankNameArray: string[] = [];
  tankLevelArray: string[] = [];
  qualityNameArray: string[] = [];
  qualityValueArray: number[] = [];
  flowRateNameArray: string[] = [];
  flowRateValueArray: any[] = [];
  flowRateValvePositionArray: number[] = [];

  contentShowStatus : boolean = false; //hide whole content on loading and show only after fetching data

  constructor(private mqttService: MQTTService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    private storage: Storage,
    // private nativeAudio: NativeAudio
    ) { 
      // this.nativeAudio.preloadSimple('bellsound', 'assets/audio/Bell-Sound.mp3').then(()=>{
      // }).catch(err => {
      //   console.log(err);
      // });
  }

  async ngOnInit() {
    this.presentLoading() //when in offline, comment. Uncomment in live
    // // this.testMessageOffline(this.testDataPayloadstring);
    await this.getDataFromLocalstorage();
  }

  ionViewDidLeave(){
    console.log("ion view did leave")
    clearTimeout(this.timeOutVariable)
    let NotExistTopic: string[] = ['FailedTopic']
    this._mqttClient = this.mqttService.loadingMqtt((error)=>{this._onConnectionLostDisconnect(error)}, (msg)=>{this._onMessageArrived(msg)}, NotExistTopic, this.MQTT_CONFIG);
  }
  
  private _onConnectionLostDisconnect(responseObject) {
    // connection listener
    console.log("inside connection lost 22");
    console.log('_onConnectionLost', responseObject);
  }
  
  private _onConnectionLost(responseObject) {
    // connection listener
    console.log("inside connection lost");
    console.log('_onConnectionLost', responseObject);
    console.log('error_code', responseObject.errorCode);
    this.contentShowStatus = false;
    if(responseObject.errorCode !== 8){
      this.presentAlert("Alert","Sorry! Connection has been lost<br> Error Code: "+responseObject.errorCode);
    }
  }

  testMessageOffline(message){
    console.log("inside test message offline");
    let jsonMessageResponse = message;
    console.log('message', jsonMessageResponse);
    
    this.getTankDetail(jsonMessageResponse);
    this.getFlowRateDetail(jsonMessageResponse);
    this.getQualityDetail(jsonMessageResponse);
    this.contentShowStatus = true;
  }

   _onMessageArrived(message) {
    this.loading.dismiss();
    clearTimeout(this.timeOutVariable)
    this.contentShowStatus = true;
    console.log("inside message arrive");
    let jsonMessageResponse = JSON.parse(message.payloadString);
    console.log('message', jsonMessageResponse);
    
    this.getTankDetail(jsonMessageResponse)
    this.getQualityDetail(jsonMessageResponse)
    this.getFlowRateDetail(jsonMessageResponse)
    // this.nativeAudio.play('bellsound')
  }


  createBarChart() {
    this.bars = new Chart(this.barChart.nativeElement, {
      type: 'bar',  //horizontalBar other type
      data: {
        labels: this.tankNameArray, // labels: ['Royal_Level', 'Public_Level'],
        datasets: [{
          label: 'Water Level:',
          data: this.tankLevelArray,  // data: [16, 2],
          backgroundColor: ['#a4c3f5', '#88d0eb'], // array should have same number of elements as number of dataset
          borderColor: ['#a4c3f5', '#88d0eb'],// array should have same number of elements as number of dataset
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              // max: 5 // tank height
            },
          }]
        },
        legend : {
          display : false
        },
        tooltips : {
          enabled : true,
        },
        hover: {
					animationDuration: 1
				},
				animation: {
				duration: 1,
				onComplete: function () {
					var chartInstance = this.chart,
						ctx = chartInstance.ctx;
						ctx.textAlign = 'center';
						ctx.fillStyle = "#059af0";
						ctx.textBaseline = 'bottom';

						this.data.datasets.forEach(function (dataset, i) {
							var meta = chartInstance.controller.getDatasetMeta(i);
							meta.data.forEach(function (bar, index) {
								var data = dataset.data[index];
								ctx.fillText(data, bar._model.x, bar._model.y + 14);

							});
						});
					}
				}
      }
    });
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
      this.presentAlert("Error", "Sorry! Cannot make a connection. Please try again after sometime.")
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
  }

  tankHeightRoyal = 4.120 //in meter
  tankHeightPublic = 4.370 //in meter

  private getTankDetail(msg:any) {
    console.log("get tank detail method")
    this.tankLevelArray = []; //to empty graph on next load
    this.tankNameArray = [];

    this.tankNameArray.push(msg.l_1.level_name); //royal 
    this.tankNameArray.push(msg.l_2.level_name); //public desup
    // let tankHeightRoyal = 4.120 //meter
    // let tankHeightPublic = 4.370 //meter
    // let royalTankReading = tankHeightRoyal //to subtract and make 0 while no data
    // let publicTankReading = tankHeightPublic //to subtract and make 0 while no data
    // msg.l_1.level = ''
    let tankLevelRoyalActualValue = this.tankHeightRoyal - (msg.l_1.level ? msg.l_1.level : this.tankHeightRoyal) //Terniary operator to subtract and make 0 while no data
    let tankLevelPublicActualValue = this.tankHeightPublic - (msg.l_2.level ? msg.l_2.level : this.tankHeightPublic) //Terniary operator to subtract and make 0 while no data
    this.tankLevelArray.push((Math.round(tankLevelRoyalActualValue * 100) / 100).toFixed(3)); 
    this.tankLevelArray.push((Math.round(tankLevelPublicActualValue * 100) / 100).toFixed(3)); 
    console.log("tank array: "+this.tankLevelArray)
    this.createBarChart();
  }

  getQualityDetail(msg) {
    console.log("inside get quality")
    this.qualityNameArray = []; //to empty data in array on next load
    this.qualityValueArray = [];

    this.qualityNameArray.push(msg.Q_1.Quality_name);
    this.qualityNameArray.push(msg.Q_2.Quality_name);
    this.qualityNameArray.push(msg.Q_3.Quality_name);
    this.qualityValueArray.push(msg.Q_1.value);
    this.qualityValueArray.push(msg.Q_2.value/100);
    this.qualityValueArray.push(msg.Q_3.value);
    console.log("quality array name: "+this.qualityNameArray);
    console.log("quality array value: "+this.qualityValueArray);
  }

  getFlowRateDetail(msg) {
    console.log("inside get flow rate")
    this.flowRateNameArray = []; //to empty data in array on next load
    this.flowRateValueArray = []; 
    this.flowRateValvePositionArray = []; 

    for (let i = 1; i <= 18; i++) {
      let messageDValue = 'd_'+i;
      this.flowRateNameArray.push(msg[messageDValue].flow_name); //msg.field is just a shorthand for msg["field"]. this.flowRateNameArray.push(msg.d_1.flow_name);
      this.flowRateValueArray.push(parseFloat(msg[messageDValue].flow_rate).toFixed(2))
      this.flowRateValvePositionArray.push(msg[messageDValue].valve_position);      
    }
    console.log("flow rate name array: "+this.flowRateNameArray);
    console.log("flow rate value array: "+this.flowRateValueArray);
    console.log("flow rate valve position: "+this.flowRateValvePositionArray);
  }

  fetchedConfigData: any;

  getDataFromLocalstorage(){
    this.storage.get('keyOfData').then((data) => {
      this.fetchedConfigData = data;
      console.log(JSON.parse(this.fetchedConfigData))
      let jsonFetchedData = JSON.parse(this.fetchedConfigData)
      this.TOPIC = [jsonFetchedData.Topic];

      this.MQTT_CONFIG = {
        host: jsonFetchedData.host,
        port: jsonFetchedData.port,
        clientId: jsonFetchedData.clientId,
      };
      this._mqttClient = this.mqttService.loadingMqtt(this._onConnectionLost, (msg)=>{this._onMessageArrived(msg)}, this.TOPIC, this.MQTT_CONFIG);
    });
  }
  
}
