import sys


def get_input(prompt: str) -> str:
	try:
		if sys.stdin.isatty():
			return input(prompt)

		if len(sys.argv) > 1:
			return sys.argv[1]

	
		data = sys.stdin.read()
		if data:
			return data.strip()

		raise EOFError
	except EOFError:
		print("No input available. Provide a value interactively, as a command-line argument, or via a pipe.", file=sys.stderr)
		sys.exit(1)


def main() -> None:
	s = get_input("Enter an integer: ")
	try:
		n = int(s)
	except Exception:
		print("Invalid integer input:", s, file=sys.stderr)
		sys.exit(2)
	print(n)


if __name__ == "__main__":
	main()