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

        it('if product is created then createProduct increments product count', async () => {
            assert.equal(productCount, 1);
        })
        it('if product is created then createProduct emits correct data', async () => {
            const event = result.logs[0].args;

            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'Macbook', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, seller, 'owner is correct')
            assert.equal(event.purchased, false, 'purchased is correct')
        })
        it('createProduct is given an invalid name, no product is created', async () => {
            await marketplace.createProduct('', web3.utils.toWei('1'), { from: seller }).should.be.rejected;
        })
        it('createProduct is given an invalid price, no product is created', async () => {
            await marketplace.createProduct('Macbook', null, { from: seller }).should.be.rejected;
            await marketplace.createProduct('Macbook', 0, { from: seller }).should.be.rejected;
        })
    });

})