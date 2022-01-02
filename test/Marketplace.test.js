const { assert } = require('chai');

/* eslint-disable no-undef */
const Marketplace = artifacts.require('./Marketplace.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should();

contract('Marketplace', ([deployer, seller, buyer]) => {
    let marketplace;
    before (async () => {
        marketplace = await Marketplace.deployed();
    })

    describe('deployment', async() => {
        it('deploys successfully', async () => {
            const address = await marketplace.address;
            assert.notEqual(address, 0x0);
        })
        it('has a name', async () => {
            const name = await marketplace.name();
            assert.equal(name, 'Dapp Marketplace');
        })
    });

    describe('products', async() => {
        let result, productCount;

        before (async () => {
            result = await marketplace.createProduct('Macbook', web3.utils.toWei('1'), { from: seller });
            productCount = await marketplace.productCount();
        })

        it('creates product then createProduct increments product count', async () => {
            assert.equal(productCount, 1);
        })
        it('creates product then createProduct emits correct data', async () => {
            const event = result.logs[0].args;

            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'Macbook', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, seller, 'owner is correct')
            assert.equal(event.purchased, false, 'purchased is correct')
        })
        it('is given an invalid name, no product is created', async () => {
            await marketplace.createProduct('', web3.utils.toWei('1'), { from: seller }).should.be.rejected;
        })
        it('is given an invalid price, no product is created', async () => {
            await marketplace.createProduct('Macbook', null, { from: seller }).should.be.rejected;
            await marketplace.createProduct('Macbook', 0, { from: seller }).should.be.rejected;
        })
        it('lists created product', async () => {
            const product = await marketplace.products(productCount);

            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(product.name, 'Macbook', 'name is correct')
            assert.equal(product.price, '1000000000000000000', 'price is correct')
            assert.equal(product.owner, seller, 'owner is correct')
            assert.equal(product.purchased, false, 'purchased is correct')
        })
        it('sells a product', async () => {
            let sellerBalancePriorToPurchase = await web3.eth.getBalance(seller);
            sellerBalancePriorToPurchase = new web3.utils.BN(sellerBalancePriorToPurchase);

            result = await marketplace.purhcaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') })
            
            let sellerBalanceAfterPurchase = await web3.eth.getBalance(seller);
            sellerBalanceAfterPurchase  = new web3.utils.BN(sellerBalanceAfterPurchase);

            let price = web3.utils.toWei('1', 'Ether');
            price = new web3.utils.BN(price);

            let actualBalance = sellerBalanceAfterPurchase.toString();
            let expectedBalance = sellerBalancePriorToPurchase.add(price).toString();

            const event = result.logs[0].args;

            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'Macbook', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, buyer, 'owner is correct')
            assert.equal(event.purchased, true, 'purchased is correct')
            assert.equal(actualBalance, expectedBalance);
        })
        it('does not sell a product that Id does not exist', async () => {
            await marketplace.purhcaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
        })
        it('does not sell product when sender did not send enough funds', async () => {
            await marketplace.purhcaseProduct(productCount, { from: buyer, value: web3.utils.toWei('.01', 'Ether') }).should.be.rejected;
        })
        it('does not sell product that has been purchased', async () => {
            await marketplace.purhcaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
        })
    });

})