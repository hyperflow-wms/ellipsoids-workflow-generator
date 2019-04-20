var argv = require('optimist').argv;
var fs = require('fs');

function createExecutionSignals(numberOfDataSamples, numberOfBaseExecutions, wfOut) {
    for (i = 0; i < numberOfDataSamples; i++) {
        for (j = 0; j < numberOfBaseExecutions; j++) {
            wfOut.signals.push({
                name: i + "" + j + ".log",
            });
            wfOut.signals.push({
                name: i + "" + j + ".xoutput",
            });
        }
    }
}

function createAverageFilesSignals(numberOfDataSamples, wfOut) {
    for (i = 0; i < numberOfDataSamples; i++) {
        wfOut.signals.push({
            name: "average_" + i + ".txt"
        });
    }
}

function createTask(name, functionName, executable, args, ins, outs) {
    return {
        "name": name,
        "function": functionName,
        "type": "dataflow",
		"firingLimit": 1,
        "config": {
            "executor": {
                "executable": executable,
                "args": args
            }
        },
        "ins": ins,
        "outs": outs
    }
}

function createWf(numberOfBaseExecutions) {

    var function_name = "RESTServiceCommand";
    var ellipsoid_program = "ellipsoids-openmp";
    var averaging_program = "mean-pack-ell";
    var number_of_data_samples = 4;

    // main tuple
    const wfOut = {
        processes: [],
        signals: [],
        ins: [],
        outs: []
    };

    wfOut.signals.push({
        name: "generateData.js",
    });
    wfOut.ins.push(0);
    wfOut.signals.push({
        name: "data.json",
    });

    for (i = 0; i < number_of_data_samples; i++) {
        wfOut.signals.push({
            name: i + ".dat",
        });
    }

    createExecutionSignals(number_of_data_samples, numberOfBaseExecutions, wfOut);
    createAverageFilesSignals(number_of_data_samples, wfOut);

    wfOut.signals.push({
        name: "summary.csv",
    });

    wfOut.outs.push(wfOut.signals.length - 1);

    wfOut.processes.push(createTask("generateData",
        function_name, "generateData.js", [], [0], [1]));

    for (i = 0; i < number_of_data_samples; i++) {
        wfOut.processes.push(createTask("create_dat_" + i,
            function_name, "createDat.js", [i + ".dat"], [1], [2 + i]));
    }

    var nextInputSignalNumber = number_of_data_samples + 2;
    for (i = 0; i < number_of_data_samples; i++) {
        for (j = 0; j < numberOfBaseExecutions; j++) {
            var pathToDatFile = i + ".dat";
            var pathToLogFile = i + "" + j + ".log";
            var x_output = i + "" + j + ".xoutput";
            wfOut.processes.push(createTask("execute_case_" + i + "_" + j, function_name,
                ellipsoid_program, [pathToDatFile, pathToLogFile,
                    x_output], [i + 2], [nextInputSignalNumber, nextInputSignalNumber + 1]));
            nextInputSignalNumber += 2;
        }
    }

    var nextXoutputSignal = number_of_data_samples + 3;
    for (i = 0; i < number_of_data_samples; i++) {
        var xOutputTab = [];
        var doneTab = [];
        for (j = 0; j < numberOfBaseExecutions; j++) {
            doneTab.push(nextXoutputSignal);
            var x_output = i + "" + j + ".xoutput";
            xOutputTab.push(x_output);
            nextXoutputSignal += 2;
        }
        xOutputTab.push("average_" + i + ".txt");
        wfOut.processes.push(createTask("average_result_" + i, function_name,
            averaging_program, xOutputTab, doneTab, [nextInputSignalNumber]));
        nextInputSignalNumber++;
    }


    var summaryIns = [];
    summaryIns.push(1);
    for (i = 0; i < number_of_data_samples; i++) {
        summaryIns.push(wfOut.signals.length - 2 - i)
    }
    wfOut.processes.push(createTask("summary",
        function_name, "summary.js", [], summaryIns, [wfOut.signals.length - 1]));

    fs.writeFile("workflow.json", JSON.stringify(wfOut, null, 2), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The workflow was saved!");
    });
}

// main function
if(argv._.length === 1) {
    createWf(argv._[0]);
} else {
    console.log("Error - not enough args");
    console.log("Running: node generator.ja base_executions")
}

