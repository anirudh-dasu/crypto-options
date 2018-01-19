import React from 'react'
import Link from 'next/link'
import withWeb3 from '../lib/withWeb3'
import { CircularProgress } from 'material-ui/Progress'
import purple from 'material-ui/colors/purple'
import {getCurrentCandleEndsIn} from '../lib/utils'


// Demonstration of a basic dapp with the withWeb3 higher-order component
class Dapp extends React.Component {

  web3Utils;

  constructor(props){
    super(props);
    this.state = { balance: null, value: '', fetchingStuff: false, takeValue: '' };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.getBetDetails = this.getBetDetails.bind(this);
    this.handleTakeChange = this.handleTakeChange.bind(this);
    this.handleTakeSubmit = this.handleTakeSubmit.bind(this);
    this.web3Utils = require('web3-utils');
  }

  placeBet = async() => {
    this.setState({fetchingStuff: true});
    const {accounts,betContract} = this.props;
    const response = await betContract.placeBet(1513908000, 1, {from: accounts[0], gas: 420000, value: web3.toWei("1.0","ether")});
    const sha3 = this.web3Utils.soliditySha3(accounts[0], 1513908000, 1);
    console.log('Bet placed. Response is ' + JSON.stringify(response));
    this.setState({fetchingStuff: false});
    console.log('Sha3 of the bet is ' + sha3);
    // alert ('Bet placed successfully. Bet hash is ' + JSON.stringify(response));
  }

  getBetDetails = async() => {
    const {accounts,betContract} = this.props; 
    const response = await betContract.getBetDetails.call(this.state.value, {from: accounts[0]});
    alert ('The bet details are ' + JSON.stringify(response));    
  }

  getAllBets = async() => {
    const {accounts,betContract} = this.props;
    const response = await betContract.getAllBetHashes.call({from:accounts[0]});
    console.log('All bets response is ' + JSON.stringify(response));
  }

  takeupBet = async() => {
    const {accounts,betContract} = this.props;
    const response = await betContract.takeupBet(this.state.takeValue, {from: accounts[0], gas: 420000, value: web3.toWei("1.0","ether")});
    console.log('Bet taken up. Response is ' + JSON.stringify(response));    
  }

  getContractBalance = async() => {
    const {accounts,betContract} = this.props;
    const response = await betContract.getBalance.call();
    console.log('The balance in the contract is ' + JSON.stringify(response));
  }

  handleChange(event){
    this.setState({value: event.target.value});
  }

  handleSubmit(event){
    event.preventDefault();
    this.getBetDetails();
  }

  handleTakeChange(event){
    this.setState({takeValue: event.target.value});
  }

  handleTakeSubmit(event){
    event.preventDefault();
    this.takeupBet();
  }

  async componentDidMount(){
    const {accounts,betContract} = this.props;
    var createdEvent = betContract.Created();
    console.log('Current candle ends in ' + getCurrentCandleEndsIn());
    createdEvent.watch(function(error,result){
      if(!error){
        console.log('Created bet with hash ' + result.args.betHash);
        createdEvent.stopWatching();
      }else{
        console.log('error is ' + error);
      }
    });
  }

  render () {
    return (
      <div>
        <h1>My Dapp</h1>

        <div><Link href='/accounts'><a>My Accounts</a></Link></div>
        <div><Link href='/'><a>Home</a></Link></div>

        <button onClick={this.placeBet}>Place Bet</button>
        <div>
        {
          this.state.fetchingStuff ?  <CircularProgress style={{ color: purple[500] }} /> : <div />
        }
        </div>


        <form onSubmit={this.handleSubmit}>
          <label>
            Bet Hash:
            <input type="text" value={this.state.value} onChange={this.handleChange}/>
          </label>
          <input type="submit" value="Get Bet Details" />
        </form> 

        <button onClick={this.getAllBets}>Get All Bets</button>

        <form onSubmit={this.handleTakeSubmit}>
          <label>
            Bet Hash:
            <input type="text" value={this.state.takeValue} onChange={this.handleTakeChange}/>
          </label>
          <input type="submit" value="Take up bet" />
        </form> 

        <div>

          <button onClick={this.getContractBalance}>Get Contract Balance</button>
        </div>

      </div>
    )
  }
}

export default withWeb3(Dapp)
