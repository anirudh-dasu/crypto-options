import initContract from 'truffle-contract'
import betContractDefinition from '../lib/contracts/CryptoBetter.json'

export const getAccounts = web3 =>
  new Promise((resolve, reject) => {
    web3.eth.getAccounts(
      (error, accounts) => (error ? reject(error) : resolve(accounts))
    )
  })

export const getBetContractInstance = async web3 => {
  const contract = initContract(betContractDefinition)
  contract.setProvider(web3.currentProvider)

  // Dirty hack for web3@1.0.0 support for localhost testrpc
  // see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
  if (typeof contract.currentProvider.sendAsync !== 'function') {
    contract.currentProvider.sendAsync = function () {
      return contract.currentProvider.send.apply(
        contract.currentProvider, arguments
      )
    }
  }

  const instance = await contract.deployed()
  return instance
}