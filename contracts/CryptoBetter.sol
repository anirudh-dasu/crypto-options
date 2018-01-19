pragma solidity ^0.4.18;

import '../libraries/UsingOraclize.sol';
import '../libraries/strings.sol';

contract CryptoBetter is usingOraclize {
    using strings for *;

    bytes32[] betHashes;

    event Created(bytes32 betHash);
    event TookupBet(bytes32 betHash);
    event SettledBet(bytes32 betHash);

    function() public payable {
        
     }

    // custom enum to store whether the maker is betting on a green or a red candle
    enum BetType {Green, Red}

    // custom struct to store the bet information
    struct Bet {
        bool exists; // set to true while creating so we know bet has been created
        address makerAddress; // address of the maker of the bet
        uint candleStartTime; // timestamp of the candle start time
        uint balance; // amount the maker has bet
        BetType betType; // type of bet
        address takerAddress; // address of the taker who has taken up the bet
    }

    // mapping of bet hashes and bets
    mapping (bytes32 => Bet) bets;

    // mapping of oracilize ids and bet hashes
    mapping (bytes32 => bytes32) oracilizeBets;

    // Maker can call this function with the candle start time and bet tyoe
    // maker should send the amount to be bet in wei
    // these funds will be locked up till the candle ends, which is candleStartTime + 1 hour
    function placeBet(uint candleStartTime, uint betTypeInt) external payable {
        // check that time is atleast 30 minutes before the candle start time
        require(candleStartTime > now + (30*60));

        // check that input candleStartTime is correct
        require(candleStartTime % 3600 == 0);

        bytes32 betHash = keccak256(msg.sender, candleStartTime, betType);

        // check that this user doesn't already have a bet for the same candle
        require(bets[betHash].candleStartTime != candleStartTime);
        BetType betType;
        if (betTypeInt == 0) {
            betType = BetType.Green;
        } else {
            betType = BetType.Red;
        }

        bets[betHash] = Bet({makerAddress: msg.sender, candleStartTime: candleStartTime, balance: msg.value, exists: true, takerAddress: address(0), betType: betType});
        betHashes.push(betHash);
        Created(betHash);
    }

    // Taker can call this function with the bethash of the bet he wants to take up
    function takeupBet(bytes32 betHash) external payable {
        // check that this bet hash exists
        require(bets[betHash].exists == true);

         // check that time is atleast 30 minutes before the candle start time
        require(bets[betHash].candleStartTime > now + (30*60));

        // check that no one has taken up this bet
        require(bets[betHash].takerAddress == address(0));

        // check that the eth sent is the same
        require(bets[betHash].balance == msg.value);

        bets[betHash].takerAddress = msg.sender;
        TookupBet(betHash);

        scheduleOracilizeQuery(betHash);

    }

    // Setup oracilize proofs and gas price
    function setupOracilize() internal {
        oraclize_setProof(proofType_TLSNotary);
        oraclize_setCustomGasPrice(4000000000 wei);
    }

    // Schedule the oracilize query and store the id in mapping with bet hash
    function scheduleOracilizeQuery(bytes32 betHash) internal {
        setupOracilize();
        uint scheduledTime = bets[betHash].candleStartTime + 3600;
        string memory url = strConcat("https://api.cryptowat.ch/markets/bitfinex/ethusd/ohlc?periods=14400&after=", uint2str(scheduledTime-1));
        string memory oracilizeString = strConcat("json(", url, ").result.14400");
        bytes32 oracilizeId = oraclize_query(scheduledTime,"URL",oracilizeString);
        oracilizeBets[oracilizeId] = betHash;
    }

    // the callback function called by oracilize. Parse the result and call the settle reward function.
    function __callback(bytes32 myId, string result, bytes proof) public {
        
        require(oracilizeBets[myId] != 0);
        require(msg.sender == oraclize_cbAddress());

        var delim = ",".toSlice();
        var parts = new string[](result.toSlice().count(delim) + 1);
        for (uint i = 0; i < parts.length; i++) {
            parts[i] = result.toSlice().split(delim).toString();
        }

        settleReward(oracilizeBets[myId], parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[4]));

    }

    // Settle the reward for the bethash. 
    // Take a 1% cut to cover the gas fees and send the reward amount to the winner address.
    function settleReward(bytes32 betHash, uint candleStartTime, uint candleOpenPrice, uint candleClosePrice) private {

        require(bets[betHash].candleStartTime == candleStartTime);

        bool makerWin = false;
        if (bets[betHash].betType == BetType.Green) {
            makerWin = (candleClosePrice > candleOpenPrice);
        } else {
            makerWin = (candleClosePrice < candleOpenPrice);
        }
        address winnerAddress = makerWin ? bets[betHash].makerAddress : bets[betHash].takerAddress;
        uint houseCut = ((bets[betHash].balance) * (2)) / 100;
        uint rewardAmount = (bets[betHash].balance * 2) - houseCut;
        winnerAddress.transfer(rewardAmount);
        SettledBet(betHash);
    }

    // Simple function that returns the number of bets in total.
    function getNumberOfBets() public view returns (uint x) {
        return betHashes.length;
    }

    // Simple function that returns all the bet hashes.
    function getAllBetHashes() public view returns (bytes32[] b) {
        return betHashes;
    }

    // A function to return the bet details of a bethash. As solidity can't return structs, we return each propery of the Bet struct.
    function getBetDetails(bytes32 betHash) public view returns (address makerAddress, address takerAddress, uint betType, uint amount, uint candleStartTime) {
        uint betTypeInt;
        if (bets[betHash].betType == BetType.Green) {
            betTypeInt = 0;
        } else {
            betTypeInt = 1;
        }
        return (bets[betHash].makerAddress, bets[betHash].takerAddress, betTypeInt, bets[betHash].balance, bets[betHash].candleStartTime);
    }

    // Get the total balance in the smart contract.
    function getBalance() public view returns (uint amount) {
        return this.balance;
    }

}