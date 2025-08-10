import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import Page_0 from "./pages/login.tsx";
import PageLayout_0 from "./pages/login.pageLayout.tsx";
import Page_1 from "./pages/_index.tsx";
import PageLayout_1 from "./pages/_index.pageLayout.tsx";
import Page_2 from "./pages/dashboard.tsx";
import PageLayout_2 from "./pages/dashboard.pageLayout.tsx";
import Page_3 from "./pages/hot-or-not.tsx";
import PageLayout_3 from "./pages/hot-or-not.pageLayout.tsx";
import Page_4 from "./pages/saved-items.tsx";
import PageLayout_4 from "./pages/saved-items.pageLayout.tsx";
import Page_5 from "./pages/post.$postId.tsx";
import PageLayout_5 from "./pages/post.$postId.pageLayout.tsx";
import Page_6 from "./pages/style-combos.tsx";
import PageLayout_6 from "./pages/style-combos.pageLayout.tsx";

if (!window.requestIdleCallback) {
  window.requestIdleCallback = (cb) => {
    setTimeout(cb, 1);
  };
}

import "./base.css";

const fileNameToRoute = new Map([["./pages/login.tsx","/login"],["./pages/_index.tsx","/"],["./pages/dashboard.tsx","/dashboard"],["./pages/hot-or-not.tsx","/hot-or-not"],["./pages/saved-items.tsx","/saved-items"],["./pages/post.$postId.tsx","/post/:postId"],["./pages/style-combos.tsx","/style-combos"]]);
const fileNameToComponent = new Map([
    ["./pages/login.tsx", Page_0],
["./pages/_index.tsx", Page_1],
["./pages/dashboard.tsx", Page_2],
["./pages/hot-or-not.tsx", Page_3],
["./pages/saved-items.tsx", Page_4],
["./pages/post.$postId.tsx", Page_5],
["./pages/style-combos.tsx", Page_6],
  ]);

function makePageRoute(filename: string) {
  const Component = fileNameToComponent.get(filename);
  return <Component />;
}

function toElement({
  trie,
  fileNameToRoute,
  makePageRoute,
}: {
  trie: LayoutTrie;
  fileNameToRoute: Map<string, string>;
  makePageRoute: (filename: string) => React.ReactNode;
}) {
  return [
    ...trie.topLevel.map((filename) => (
      <Route
        key={fileNameToRoute.get(filename)}
        path={fileNameToRoute.get(filename)}
        element={makePageRoute(filename)}
      />
    )),
    ...Array.from(trie.trie.entries()).map(([Component, child], index) => (
      <Route
        key={index}
        element={
          <Component>
            <Outlet />
          </Component>
        }
      >
        {toElement({ trie: child, fileNameToRoute, makePageRoute })}
      </Route>
    )),
  ];
}

type LayoutTrieNode = Map<
  React.ComponentType<{ children: React.ReactNode }>,
  LayoutTrie
>;
type LayoutTrie = { topLevel: string[]; trie: LayoutTrieNode };
function buildLayoutTrie(layouts: {
  [fileName: string]: React.ComponentType<{ children: React.ReactNode }>[];
}): LayoutTrie {
  const result: LayoutTrie = { topLevel: [], trie: new Map() };
  Object.entries(layouts).forEach(([fileName, components]) => {
    let cur: LayoutTrie = result;
    for (const component of components) {
      if (!cur.trie.has(component)) {
        cur.trie.set(component, {
          topLevel: [],
          trie: new Map(),
        });
      }
      cur = cur.trie.get(component)!;
    }
    cur.topLevel.push(fileName);
  });
  return result;
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>Go back to the <a href="/" style={{ color: 'blue' }}>home page</a>.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          {toElement({ trie: buildLayoutTrie({
"./pages/login.tsx": PageLayout_0,
"./pages/_index.tsx": PageLayout_1,
"./pages/dashboard.tsx": PageLayout_2,
"./pages/hot-or-not.tsx": PageLayout_3,
"./pages/saved-items.tsx": PageLayout_4,
"./pages/post.$postId.tsx": PageLayout_5,
"./pages/style-combos.tsx": PageLayout_6,
}), fileNameToRoute, makePageRoute })} 
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
