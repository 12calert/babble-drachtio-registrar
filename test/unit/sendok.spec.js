/*
  Dependencies
*/

const should = require( "chai" ).should()

const Request = require( "../mock/request.js" )

const { getsingleton, setsingleton } = require( "../../lib/registrar.js" )
const sendok = require( "../../lib/sendok.js" )

/*
  Assertions
*/

describe( "sendok.js", function() {

  it( "exports the sendok function", function() {

    sendok.name.should.equal( "sendok" )
    sendok.should.be.an( "function" )

  } )

  describe( "sendok (function)", function() {

    it( "sets headers applying the singleton regping option if present", function() {

      setsingleton( { options: { regping: 2 } } )

      const intercept = ( status, options ) => {
          status.should.equal( 200 )
          options.headers.Contact.should.equal( "expires=2" )
          options.headers.Expires.should.equal( 2 )
      }

      sendok( Request.init(), { send: intercept }, getsingleton().options ) // 1

    } )

    it( "sets headers applying request registrar properties if singleton regping option not present", function() {

      setsingleton( { options: {} } )

      const intercept = ( status, options ) => { 
        status.should.equal( 200 )
        options.headers.Contact.should.equal( "expires=1" )
        options.headers.Expires.should.equal( 1 )
      }

      sendok( Request.init(), { send: intercept }, getsingleton().options )

    } )
  } )
} )