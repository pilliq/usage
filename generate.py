#!/usr/bin/env python
import subprocess

phantom_cmd = 'phantomjs'
phantom_script = 'render_graph.js'

graphs = (
    [phantom_cmd, phantom_script, 'http://localhost:8000/viz', 'static/img/viz.gif', '1600', '1200', '3'],
    [phantom_cmd, phantom_script, 'http://localhost:8000/line_viz', 'static/img/line_viz.gif', '960', '500', '2'],
    [phantom_cmd, phantom_script, 'http://localhost:8000/pie_viz', 'static/img/pie_viz.gif', '1600', '1200', '2'],
    [phantom_cmd, phantom_script, 'http://localhost:8000/stack', 'static/img/stack.gif', '1600', '1200', '3'],
    [phantom_cmd, phantom_script, 'http://localhost:8000/numbers', 'static/img/numbers.gif', '1600', '1200', '2'],
)

if __name__ == '__main__':
    processes = set()
    for graph in graphs:
        processes.add(subprocess.Popen(graph, stdout=subprocess.PIPE))
    for proc in processes:
        out, err = proc.communicate()
        if err is not None:
            print("Error: " + str(err))
        if len(out) != 0:
            print("Stdout: " + out)
