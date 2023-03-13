"use strict";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import * as dotenv from "dotenv";
dotenv.config();
import got from "got";
import S3Client from "@aws-sdk/client-s3";

/*
TO DO:
copy values from CloudFormation outputs into USERPOOLID and JWKS letiables
*/

let USERPOOLID = process.env.USERPOOLID;

/*
verify values above
*/

let region = "us-east-1";
let cognito_host = "cognito-idp." + region + ".amazonaws.com";
let iss = "https://" + cognito_host + "/" + USERPOOLID;
let jwks_url = iss + "/.well-known/jwks.json";
/*
get jwks
*/
async function fetchData() {
  try {
    let pems = {};
    const response = await got(jwks_url);
    let keys = JSON.parse(response.body).keys;
    for (let i = 0; i < keys.length; i++) {
      //Convert each key to PEM
      let key_id = keys[i].kid;
      let modulus = keys[i].n;
      let exponent = keys[i].e;
      let key_type = keys[i].kty;
      let jwk = { kty: key_type, n: modulus, e: exponent };
      let pem = jwkToPem(jwk);
      pems[key_id] = pem;
    }
    return pems;
  } catch (error) {
    console.log(error);
  }
}
let pems = await fetchData();
const response401 = {
  status: "401",
  statusDescription: "Unauthorized",
};

export async function handler(event, context, callback) {
  const cfrequest = event.Records[0].cf.request;
  const headers = cfrequest.headers;
  console.log("getting started");
  console.log("USERPOOLID=" + USERPOOLID);
  console.log("region=" + region);
  Object.keys(pems).forEach((key) => {
    console.log("key:" + key);
    console.log("pem:" + pems[key]);
  });

  //Fail if no authorization header found
  if (!headers.authorization) {
    console.log("no auth header");
    callback(null, response401);
    return false;
  }

  //strip out "Bearer " to extract JWT token only
  let jwtToken = headers.authorization[0].value.slice(7);
  console.log("jwtToken=" + jwtToken);

  //Fail if the token is not jwt
  let decodedJwt = jwt.decode(jwtToken, { complete: true });
  console.log(decodedJwt);
  if (!decodedJwt) {
    console.log("Not a valid JWT token");
    callback(null, response401);
    return false;
  }

  //Fail if token is not from your UserPool
  if (decodedJwt.payload.iss != iss) {
    console.log("invalid issuer");
    callback(null, response401);
    return false;
  }

  //Reject the jwt if it's not an 'Access Token'
  if (decodedJwt.payload.token_use != "access") {
    console.log("Not an access token");
    callback(null, response401);
    return false;
  }

  //Get the kid from the token and retrieve corresponding PEM
  let kid = decodedJwt.header.kid;
  let pem = pems[kid];
  if (!pem) {
    console.log("Invalid access token");
    callback(null, response401);
    return false;
  }

  //Verify the signature of the JWT token to ensure it's really coming from your User Pool
  jwt.verify(jwtToken, pem, { issuer: iss }, function (err, payload) {
    if (err) {
      console.log("Token failed verification");
      callback(null, response401);
      return false;
    } else {
      //Valid token.
      console.log("Successful verification");
      // accessTokenからscopeで許可されるプレフィックス部分を取り出し
      let scopearray = decodedJwt.payload.scope.split("//");
      let preffix = scopearray[2].split(".", 1);
      // cfrequest.uriの先頭に/scopeを追加
      let replaceduri = "/" + preffix[0] + cfrequest.uri;
      cfrequest.uri = replaceduri;
      console.log(cfrequest.uri + "->" + replaceduri);
      //remove authorization header
      delete cfrequest.headers.authorization;
      //CloudFront can proceed to fetch the content from origin
      callback(null, cfrequest);
      return true;
    }
  });
}
