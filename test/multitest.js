const {expect} = require('chai');
const{Ethers} = require('ethers')
const { parseBytes32String } = require('ethers/lib/utils');
const {ethers} = require('hardhat');
describe('the multisig wallet test',()=> {
    let accounts,token,wallet;
    const amount= ethers.utils.parseEther("10");
    const toBytes = (string)=> Array.from(Buffer.from(string,'utf8'));

    before(async()=> {
        let contract = await ethers.getContractFactory("MultiSigWallet");
        accounts = await ethers.getSigners();
        token = await contract.deploy([accounts[1].address,accounts[2].address],1);
        await token.deployed();
        console.log("deployed");
         wallet = await token.connect(accounts[1]);
        await wallet.submitTransaction(accounts[3].address,amount,toBytes("hello"));

    });
    it("owner should be greated than zero",async()=> {
        const owners = await token.getOwners();
        await expect(owners.length).gt(0);
         
    })
    it("numconfirmations should be less than or equal to owners",async()=> {
        const owners = await token.getOwners();
        const NumsC = await token.GetNumconfirmationrequired();
        await expect(NumsC).lessThanOrEqual(owners.length);
    })
   
    it("owners should be unique",async()=> {
        const owners = await token.getOwners();
        
        let count = 0;
       for(let i =0;i<owners.length;i++){
        for(let j = 1; j<owners.length-1;j++){
            if(owners[i]== owners[j]){
                count++;
            }
        }
       }
       expect(count).to.equal(0);
            
    
       
     } )
     it(" only owner can submit transaction",async()=> {
        const toBytes = (string)=> Array.from(Buffer.from(string,'utf8'));
        await expect( token.submitTransaction(accounts[4].address,amount,toBytes("hi"))).to.be.reverted;
        
        
     })
     it("testing submit transaction",async()=> {
        const BeforeSubmit = await token.getTransactionCount();
        await  wallet.submitTransaction(accounts[1].address,amount,toBytes("hi"));
        const AfterSubmit = await token.getTransactionCount();
        expect(AfterSubmit).to.equal(BeforeSubmit.add(1));
     })

     it("testing confirm transcation",async()=> {
        const toBytes = (string)=> Array.from(Buffer.from(string,'utf8'));
        const Txcount =  await token.getTransactionCount();
        const Transaction = await token.getTransaction(Txcount-1);
        const BeforeConfirm = Transaction.numConfirmations;
        const wallet2 = await token.connect(accounts[2]);
        await wallet2.confirmTransaction(Txcount-1);
        const ConfirmTransaction = await token.getTransaction(Txcount-1)
        const AfterConfirm = ConfirmTransaction.numConfirmations;
        expect(AfterConfirm).to.equal(BeforeConfirm.add(1));
     })

     it("testing deposit function",async()=> {
        const beforeDeposit = (await wallet.GetsmartcontractBalance())/10**18;
        const option = {value:amount};
        await wallet.DepositETH({value: amount});
        const AfterDeposit = (await wallet.GetsmartcontractBalance())/10**18;
        console.log(AfterDeposit);
        expect(AfterDeposit).gt(beforeDeposit);


     })
     it("Transaction which does not exist cannot be executed",async()=> {
        const Txcount = Number(await token.getTransactionCount());
        console.log(Txcount);
         await expect(wallet.executeTransaction(Txcount)).to.be.reverted;
     })
     it("only owner can execute transaction",async()=> {
        const Txcount = Number(await token.getTransactionCount());
        console.log(Txcount);
        await expect(token.executeTransaction(Txcount-1)).to.be.reverted;
        
    })
     it("transaction can only be executed if sufficient confirmation are met ",async()=> {

         await expect(wallet.executeTransaction(0)).to.be.reverted;
     })
     it("testing execute transaction function",async()=> {
        const Transaction = await token.getTransaction(0);
        const Beforeexe = Number(await token.GetBalance(Transaction.to));
        console.log(Beforeexe);
        await wallet.confirmTransaction(0);
        await wallet.executeTransaction(0);
        const NTransaction = await token.getTransaction(0);
        const Afterexe = Number(await token.GetBalance(NTransaction.to));
        console.log(Afterexe);

        expect(NTransaction.executed).to.equal(true);
        expect((Afterexe)).gt(Beforeexe)


     })
     it("only owner can revoke transaction",async()=> {
        await expect(wallet.revokeConfirmation(1)).to.be.reverted;
     })
     it("transaction should be confirmed before revoking it",async()=> {
        await wallet.submitTransaction(accounts[5].address,amount,toBytes("hello"));
        const Txcount = Number(await wallet.getTransactionCount());
        console.log(Txcount);
        await expect(wallet.revokeConfirmation(2)).to.be.reverted;
     })
     it("already executed transaction will not be revoked",async()=> {
        
        await expect(wallet.revokeConfirmation(0)).to.be.reverted;

     })
     it("transaction should exist to revoke it",async()=> {
       await expect(wallet.revokeConfirmation(4)).to.be.reverted;
     })
     it("testing revoke confirmation function",async()=> {
        await wallet.confirmTransaction(2);
        const Transaction = await wallet.getTransaction(2);
        await wallet.revokeConfirmation(2);
        const NTransaction = await wallet.getTransaction(2);
        expect(Transaction.numConfirmations).to.equal(NTransaction.numConfirmations.add(1));
        await expect( wallet.revokeConfirmation(2)).to.be.reverted
     })

    
    })
    


