// Set test env
process.env.NODE_ENV = "test"

const mongoose = require("mongoose")
import User from "../build/models/user"

// Require the dev-dependencies
const chai = require("chai")
const chaiHttp = require("chai-http")
const server = require("../index.ts")
const should = chai.should()

chai.use(chaiHttp)
describe("Users", () => {
  // beforeEach((done) => { // Before each test we empty the database
  //     User.remove({}, (err) => {
  //        done();
  //     });
  // });
  describe("/GET transactions", () => {
    it("it should GET all the transactions", (done) => {
      chai.request(server)
        .get("/data")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });

});
