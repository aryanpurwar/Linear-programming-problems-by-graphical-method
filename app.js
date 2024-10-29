
document.addEventListener("DOMContentLoaded", () => {
    const constraintsDiv = document.getElementById("constraints");
    const plotDiv = document.getElementById("plot");
    const solutionDiv = document.getElementById("solution");

    console.log("Project created by [Your Name]");

    // Function to add a new constraint input field
    window.addConstraint = function() {
        const constraintCount = constraintsDiv.getElementsByTagName("label").length + 1;
        const label = document.createElement("label");
        label.innerHTML = `Constraint ${constraintCount}: 
            <input type="text" placeholder="e.g., x + y <= 10">`;
        constraintsDiv.appendChild(label);
    };

    // Parse input into coefficients for x and y
    function parseExpression(expr) {
        const terms = expr.match(/([+-]?\d*\.?\d*)([xy])/g);
        const coeffs = { x: 0, y: 0 };

        terms.forEach(term => {
            const [, coef, variable] = term.match(/([+-]?\d*\.?\d*)([xy])/);
            coeffs[variable] += coef === "" || coef === "+" ? 1 : coef === "-" ? -1 : parseFloat(coef);
        });

        return coeffs;
    }

    // Extract constraint details
    function parseConstraint(constraint) {
        const parts = constraint.split(/(<=|>=|=)/);
        const expr = parseExpression(parts[0].trim());
        const inequality = parts[1];
        const bound = parseFloat(parts[2].trim());
        return { ...expr, bound, inequality };
    }

    // Calculate intersection point of two lines
    function intersectionPoint(line1, line2) {
        const determinant = line1.x * line2.y - line2.x * line1.y;
        if (determinant === 0) return null; // Lines are parallel
        const x = (line2.y * line1.bound - line1.y * line2.bound) / determinant;
        const y = (line1.x * line2.bound - line2.x * line1.bound) / determinant;
        return { x, y };
    }

    // Check if point satisfies all constraints
    function isFeasible(point, constraints) {
        return constraints.every(({ x, y, bound, inequality }) => {
            const value = x * point.x + y * point.y;
            if (inequality === "<=") return value <= bound;
            if (inequality === ">=") return value >= bound;
            return value === bound;
        });
    }

    // Solve LPP and display results
    window.solveLPP = function() {
        const objective = document.getElementById("objective").value;
        const objectiveCoeffs = parseExpression(objective);

        const constraints = Array.from(constraintsDiv.getElementsByTagName("input")).map(input => parseConstraint(input.value));

        // Get all intersection points of the constraints
        const vertices = [];
        for (let i = 0; i < constraints.length; i++) {
            for (let j = i + 1; j < constraints.length; j++) {
                const point = intersectionPoint(constraints[i], constraints[j]);
                if (point && isFeasible(point, constraints)) {
                    vertices.push(point);
                }
            }
        }

        // Evaluate objective function at each vertex
        let optimalPoint = null;
        let optimalValue = -Infinity;
        vertices.forEach(point => {
            const value = objectiveCoeffs.x * point.x + objectiveCoeffs.y * point.y;
            if (value > optimalValue) {
                optimalValue = value;
                optimalPoint = point;
            }
        });

        // Plot constraints and feasible region
        const constraintTraces = constraints.map(({ x, y, bound }, i) => {
            const traceX = [0, bound / x];
            const traceY = [bound / y, 0];
            return {
                x: traceX,
                y: traceY,
                mode: 'lines',
                name: `Constraint ${i + 1}: ${x}x + ${y}y <= ${bound}`,
            };
        });

        // Plot feasible vertices
        const feasibleTrace = {
            x: vertices.map(v => v.x),
            y: vertices.map(v => v.y),
            mode: 'markers',
            marker: { color: 'green', size: 8 },
            name: 'Feasible Region Vertices'
        };

        // Plot optimal point
        const optimalTrace = {
            x: [optimalPoint.x],
            y: [optimalPoint.y],
            mode: 'markers+text',
            marker: { color: 'red', size: 10 },
            text: `Optimal (${optimalPoint.x.toFixed(2)}, ${optimalPoint.y.toFixed(2)})`,
            name: 'Optimal Solution'
        };

        // Plot layout
        const layout = {
            title: "Feasible Region & Optimal Solution",
            xaxis: { title: "x", range: [0, Math.max(...vertices.map(v => v.x)) + 1] },
            yaxis: { title: "y", range: [0, Math.max(...vertices.map(v => v.y)) + 1] }
        };

        Plotly.newPlot(plotDiv, [...constraintTraces, feasibleTrace, optimalTrace], layout);

        // Display solution
        solutionDiv.innerHTML = `
            <p>Optimal Solution:</p>
            <p>x = ${optimalPoint.x.toFixed(2)}, y = ${optimalPoint.y.toFixed(2)}</p>
            <p>Maximum Value of Objective = ${optimalValue.toFixed(2)}</p>
        `;
    };
});
