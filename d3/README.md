# Integration of D3 JS Visualization library into Rizort Web app

## Why?
1. D3 is a feature rich Document visualization library which can fit into our usecases very smoothly. We can show various charts for our admin app (to overcome Kibana's potential limitations), document visualizations like graph model display for scene graph etc.


## Which Verison?
1. We are using d3's version 4.x currently. We don't refer it to as bower component as it is not angular compatible in its pure form. So we refer it by a dynamic download of d3.v4.min.js from [https://d3js.org/d3.v4.min.js](https://d3js.org/d3.v4.min.js) into our custom service d3Service.js.
2. 