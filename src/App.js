import React, { useState, useRef, useEffect } from "react";
import {
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from "@mui/x-data-grid";
import CodeMirror from "@uiw/react-codemirror";
import "codemirror/theme/material.css";
import "codemirror/mode/sql/sql";
import "./App.css";
import { employeesData, productsData, suppliersData, ordersData } from "./DataFromCSV";

const buildTable = (data) => ({
  rows: data,
  columns: Object.keys(data[0] || {}).map((key) => ({
    field: key,
    headerName: key,
    flex: 1,
  })),
});

const tables = {
  employees: { label: "Employees", ...buildTable(employeesData) },
  products: { label: "Products", ...buildTable(productsData) },
  suppliers: { label: "Suppliers", ...buildTable(suppliersData) },
  orders: { label: "Orders", ...buildTable(ordersData) },
};

const randomQueries = [
  { query: "SELECT * FROM employees WHERE FirstName LIKE 'A%'", table: "employees", filter: (row) => row.FirstName && row.FirstName.toLowerCase().startsWith("a") },
  { query: "SELECT * FROM products WHERE UnitPrice > 20", table: "products", filter: (row) => parseFloat(row.UnitPrice) > 20 },
  { query: "SELECT * FROM suppliers WHERE Country = 'USA'", table: "suppliers", filter: (row) => row.Country && row.Country.toLowerCase() === "usa" },
  { query: "SELECT * FROM orders WHERE Freight < 15", table: "orders", filter: (row) => parseFloat(row.Freight) < 15 },
  { query: "SELECT * FROM employees WHERE LastName LIKE '%son'", table: "employees", filter: (row) => row.LastName && row.LastName.toLowerCase().endsWith("son") },
  { query: "SELECT * FROM products WHERE UnitsInStock < 20", table: "products", filter: (row) => parseInt(row.UnitsInStock) < 20 },
  { query: "SELECT * FROM orders WHERE ShipCountry = 'France'", table: "orders", filter: (row) => row.ShipCountry && row.ShipCountry.toLowerCase() === "france" },
  { query: "SELECT * FROM suppliers WHERE CompanyName LIKE '%Liquids%'", table: "suppliers", filter: (row) => row.CompanyName && row.CompanyName.toLowerCase().includes("liquids") },
  { query: "SELECT * FROM products WHERE ProductName LIKE '%tea%'", table: "products", filter: (row) => row.ProductName && row.ProductName.toLowerCase().includes("tea") },
  { query: "SELECT * FROM orders WHERE EmployeeID = 5", table: "orders", filter: (row) => row.EmployeeID && parseInt(row.EmployeeID) === 5 }
];

function App() {
  const [activeTable, setActiveTable] = useState("employees");
  const [query, setQuery] = useState("SELECT * FROM employees");
  const [gridRows, setGridRows] = useState(tables.employees.rows);
  const [gridCols, setGridCols] = useState(tables.employees.columns);
  const [editorHeight, setEditorHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyWidth, setHistoryWidth] = useState(400);
  const [isHistoryResizing, setIsHistoryResizing] = useState(false);

  const editorContainerRef = useRef(null);
  const containerRef = useRef(null);

  // Set initial history width to 30% of container width
  useEffect(() => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setHistoryWidth(containerRect.width * 0.3);
    }
  }, []);

  const handleTableSelect = (tableKey) => {
    setActiveTable(tableKey);
    setGridRows(tables[tableKey].rows);
    setGridCols(tables[tableKey].columns);
    setQuery(`SELECT * FROM ${tableKey}`);
  };

  const generateRandomQuery = () => {
    const randomIndex = Math.floor(Math.random() * randomQueries.length);
    const rq = randomQueries[randomIndex];
    setQuery(rq.query);
  };

  const handleRunQuery = () => {
    setHistory((prev) => [query, ...prev.filter((q) => q !== query)]);
    const lowerQuery = query.toLowerCase();
    let matchedTable = null;
    for (const tableKey of Object.keys(tables)) {
      if (lowerQuery.includes(`from ${tableKey}`)) {
        matchedTable = tableKey;
        break;
      }
    }
    if (!matchedTable) {
      const keys = Object.keys(tables);
      matchedTable = keys[Math.floor(Math.random() * keys.length)];
    }
    const rows = tables[matchedTable].rows;
    let filteredRows = [...rows];
    if (lowerQuery.includes("where")) {
      const conditionPart = lowerQuery.split("where")[1].trim();
      if (conditionPart.includes("=")) {
        const [left, right] = conditionPart.split("=");
        const field = left.trim().replace(/['` ]/g, "");
        const value = right.trim().replace(/['` ]/g, "");
        filteredRows = rows.filter((r) => {
          if (!r[field]) return false;
          return String(r[field]).toLowerCase() === value.toLowerCase();
        });
      }
    }
    setActiveTable(matchedTable);
    setGridCols(tables[matchedTable].columns);
    setGridRows(filteredRows);
  };

  const clearHistory = () => setHistory([]);

  // Keyboard shortcut: Ctrl+Enter to run query
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunQuery();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  // Vertical resizing for query editor
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !editorContainerRef.current) return;
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      const newHeight = e.clientY - containerRect.top;
      const minHeight = 100;
      const maxHeight = containerRect.height - 100;
      const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      setEditorHeight(constrainedHeight);
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Horizontal resizing for history sidebar
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isHistoryResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const minWidth = 150;
      const maxWidth = containerRect.width - 300;
      const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setHistoryWidth(constrainedWidth);
    };

    const handleMouseUp = () => setIsHistoryResizing(false);

    if (isHistoryResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isHistoryResizing]);

  return (
    <Box className="container" ref={containerRef}>
      <Box className="sidebar">
        <Typography variant="h6" className="sidebarTitle">Tables</Typography>
        <List>
          {Object.keys(tables).map((tableKey) => (
            <ListItem
              button
              key={tableKey}
              onClick={() => handleTableSelect(tableKey)}
              className="sidebarItem"
            >
              <ListItemText primary={tables[tableKey].label} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box className="mainContainer">
        <Box className="main">
          <Box ref={editorContainerRef} className="editor-container">
            <Paper className="queryPaper" style={{ height: editorHeight }}>
              <Typography variant="subtitle1">SQL Query</Typography>
              <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                <CodeMirror
                  value={query}
                  height="100%"
                  options={{
                    mode: "sql",
                    theme: "material",
                    lineNumbers: true,
                  }}
                  onChange={(value) => setQuery(value)}
                />
              </Box>
              <Box className="buttonRow">
                <Button variant="contained" color="primary" onClick={handleRunQuery}>
                  Run
                </Button>
                <Button variant="contained" color="secondary" onClick={generateRandomQuery} className="randomBtn">
                  Generate Random Query
                </Button>
              </Box>
            </Paper>
            <div
              className="resizer"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
            <Paper className="dataGridPaper">
              {/* <Typography variant="subtitle1">
                Table: {tables[activeTable].label}
              </Typography> */}
              <DataGrid
                rows={gridRows}
                columns={gridCols}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                density="compact"
                hideFooter
              />
            </Paper>
          </Box>
        </Box>
        <div
          className="verticalResizer"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsHistoryResizing(true);
          }}
        />
        <Box className="historySidebar" style={{ width: historyWidth }}>
          <Box className="historyHeader">
            <Typography variant="h6" className="historyTitle">History</Typography>
            <Tooltip title="Clear All History">
              <IconButton size="small" onClick={clearHistory} className="clearHistoryBtn">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <List>
            {history.map((q, index) => (
              <ListItem
                key={index}
                className="historyItem"
              >
                <Box className="historyItemHeader">
                  <Box className="historyItemTitle">
                    <Tooltip title="Edit Connection">
                      <IconButton size="small" sx={{ color: "#ccc" }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="16"
                          viewBox="0 0 24 24"
                          width="16"
                          fill="currentColor"
                        >
                          <path d="M3 17.25V21h3.75l11-11-3.75-3.75L3 17.25zM20.71 5.04a1.0001 1.0001 0 0 0 0-1.41l-1.34-1.34a1.0001 1.0001 0 0 0-1.41 0l-1.54 1.54 3.75 3.75 1.54-1.54z" />
                        </svg>
                      </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ color: "#fff" }}>
                      SQL
                    </Typography>
                  </Box>
                  <Box className="historyItemActions">
                    <Tooltip title="Run this query">
                      <IconButton
                        size="small"
                        sx={{ color: "#ccc" }}
                        onClick={() => {
                          setQuery(q);
                          handleRunQuery(); // if you want to run immediately
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="18"
                          viewBox="0 0 24 24"
                          width="18"
                          fill="currentColor"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  className="historyItemQuery"
                  onClick={() => setQuery(q)}
                >
                  {q}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
