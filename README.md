<div align="center">

<img src="images/logo.svg" alt="Logo" width="150" height="150" />

# DDUIX

DDUIX is a declarative user interface markup and styling language which is currently under active development.
It is compiled into JSON files that can be consumed by Minecraft's Data-Driven UI (DDUI) system.

</div>

## Features

- XML-inspired markup format
- Custom component definitions
- Style definition inheritance
- Full Visual Studio Code integration, including syntax highlighting and autocomplete

## Project Status

This project is a work in progress and is currently not available on NPM.
Some features may not yet be fully implemented and language design decisions such as syntax are not yet final.

Expect full documentation to be available by the time features are finalised.

## Syntax Example

```
root my:root at minecraft:screen {
  <my:component attr=false>
    <minecraft:label @my:decorator />
  </my:component>
}

component my:component(attr boolean) {
  <minecraft:visibility visible={this.attr}>
    <children />
  </minecraft:visibility>
}

decorator my:decorator boolean {
  <target text="hi" />
}

style my:style {
  minecraft:label {
    color = #ffffff;
    shadow = false;
  }
}
```
