import React from 'react'
import getWeb3 from './getWeb3'
import { getAccounts, getBetContractInstance } from './utils'

const withWeb3 = PassedComponent => class extends React.Component {
  state = { web3: null, accounts: null, betContract: null}

  async componentDidMount () {
    try {
      const web3 = await getWeb3()
      const accounts = await getAccounts(web3)
      const betContract = await getBetContractInstance(web3)
      this.setState({ web3, accounts, betContract })
    } catch (error) {
      alert(`Failed to load web3, accounts, and contract. Check console for details.`)
      console.log(error)
    }
  }

  render () {
    const { web3, accounts,betContract } = this.state
    const appReady = web3 && accounts && betContract
    // Web3 is still loading, let the user know
    if (!appReady) {
      return <div>Loading web3, accounts, and contract.</div>
    }
    // Web3 is ready, inject Web3, accounts, and contract into the PassedComponent
    return (
      <PassedComponent
        web3={web3}
        accounts={accounts}
        betContract={betContract}
      />
    )
  }
}

export default withWeb3
