run-swc-compiler-magic:
	# Compile & Run the "reactivity example"
	@deno run -A swc-compiler-magic/src/main.ts 		\
		swc-compiler-magic/examples/reactivity.ts 	\
		swc-compiler-magic/dist/reactivity.js
	@deno run swc-compiler-magic/dist/reactivity.js

	# Compile the "comptime example"
	@deno run -A swc-compiler-magic/src/main.ts 		\
		swc-compiler-magic/examples/comptime.ts 	\
		swc-compiler-magic/dist/comptime.js
	# Run the "comptime example"
	@deno run swc-compiler-magic/dist/comptime.js

run-strike:
	@deno run -A strike/main.ts

run-tano-swc:
	@deno run -A tano-swc/main.ts
