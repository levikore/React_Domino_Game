import React , {Component} from 'react';


class TimeUtils extends Component{
        constructor(props) {
          super(props);
          this.timer = 0;
          this.prevAvgTime = this.secondsToTime(0);
          this.startTimer = this.startTimer.bind(this);
          this.countUp = this.countUp.bind(this);
          this.calculateAvgTime = this.calculateAvgTime.bind(this);
          this.state = { 
              time: {},
              seconds: 0             
            };
        
          this.startTimer();
        }
      
        secondsToTime(secs){
          let hours = Math.floor(secs / (60 * 60));
      
          let divisor_for_minutes = secs % (60 * 60);
          let minutes = Math.floor(divisor_for_minutes / 60);
      
          let divisor_for_seconds = divisor_for_minutes % 60;
          let seconds = Math.ceil(divisor_for_seconds);
      
          let timeBlock = {
            "h": hours,
            "m": minutes,
            "s": seconds
          };
          return timeBlock;
        }
      
        componentDidMount() {
            let timeVar = this.secondsToTime(this.state.seconds);     
            this.setState({ 
                time: timeVar
              }
              );         
        }

        calculateAvgTime(){
            let avgTime = this.prevAvgTime;

            if(this.props.avgTimeOn){
                console.log(this.props.numOfTurns);
                if(this.props.numOfTurns != 0){
                    avgTime =this.secondsToTime((this.state.seconds)/(this.props.numOfTurns));
                    this.prevAvgTime = avgTime;
                }
            }

            console.log(avgTime);
            return avgTime;
        }

        startTimer() {
          this.timer = 0;
          this.state.seconds = 0;
          this.timer = setInterval(this.countUp, 1000);
        }
      
        countUp() {
          console.log(this.props.isGameOn);
          if(this.props.isGameOn){
            let seconds = this.state.seconds + 1;
            this.setState({
              time: this.secondsToTime(seconds),
              seconds: seconds,
            });
          }
          else{
            clearInterval(this.timer);
          } 
            
        }

        componentDidUpdate(prevProps){
          if(prevProps.isGameOn === false && this.props.isGameOn === true){
            this.startTimer();
          }
        }
      
        render() {
            const avgTime = this.calculateAvgTime();
            console.log(avgTime);
          return(
            <div>
             <p>Game time: m {this.state.time.m} s {this.state.time.s}</p>
             <p>Turn's average time: m {avgTime.m} s {avgTime.s}</p>  
            </div>
          );
        }
      }

export default TimeUtils;


//