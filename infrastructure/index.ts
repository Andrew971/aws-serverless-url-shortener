#!/usr/bin/env node
import "source-map-support/register"
import { App } from "aws-cdk-lib"
import { Service } from './urlShorternerService'

const app = new App()

new Service(app, "UrlShorternerService", {})